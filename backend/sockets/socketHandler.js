import Whiteboard from "../model/whiteboard.model.js";
import ChatMessage from "../model/chatMessage.model.js";
import Room from "../model/room.model.js";
import jwt from "jsonwebtoken";
import User from "../model/User.model.js";

// In-memory game state per room
const games = {};
// In-memory room users
const roomUsers = {};
// In-memory reactions per room
const roomReactions = {};
// Timeouts for room cleanup (grace period)
const roomDeleteTimeouts = {};

// Word list
const WORDS = [
  "apple", "banana", "car", "dog", "elephant", "flower", "guitar", "house",
  "ice cream", "jungle", "kite", "lion", "mountain", "notebook", "ocean",
  "piano", "queen", "rainbow", "sunflower", "tree", "umbrella", "volcano",
  "waterfall", "xylophone", "yacht", "zebra", "airplane", "basketball",
  "chocolate", "diamond", "eagle", "football", "giraffe", "hammer",
  "island", "jellyfish", "kangaroo", "lighthouse", "mushroom", "necklace",
  "octopus", "penguin", "robot", "scissors", "telescope", "unicorn",
  "violin", "whale", "bicycle", "butterfly", "castle", "dragon",
  "fireworks", "ghost", "helicopter", "igloo", "jacket", "koala",
  "ladder", "mermaid", "ninja", "owl", "pirate", "rocket", "snowman",
  "tornado", "vampire", "wizard", "anchor", "bridge", "candle",
  "dolphin", "envelope", "feather", "globe", "helmet", "iceberg",
  "jewel", "keyboard", "lamp", "magnet", "nest", "parachute",
  "ring", "satellite", "train", "umbrella", "window", "compass",
  "crown", "drum", "emerald", "flag", "guitar", "heart",
  "key", "leaf", "moon", "star", "sun", "cloud", "fire",
];

function getRandomWords(count = 3) {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getWordHint(word) {
  return word.split("").map((ch) => (ch === " " ? " " : "_")).join("");
}

export const socketHandler = (io) => {
  // JWT middleware for socket auth
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.user.username);

    // ===== ROOM EVENTS =====

    socket.on("join-room", async (data) => {
      // Support both old format (string) and new format ({roomId, avatar})
      const roomId = typeof data === 'string' ? data : data.roomId;
      const avatar = typeof data === 'object' ? data.avatar : null;

      socket.join(roomId);
      socket.roomId = roomId;

      // Clear any pending deletion timeout since someone joined
      if (roomDeleteTimeouts[roomId]) {
        clearTimeout(roomDeleteTimeouts[roomId]);
        delete roomDeleteTimeouts[roomId];
        console.log(`Room cleanup cancelled for ${roomId}`);
      }

      // Track users in room
      if (!roomUsers[roomId]) roomUsers[roomId] = [];

      const existingUser = roomUsers[roomId].find(
        (u) => u.userId === socket.user._id.toString()
      );
      if (!existingUser) {
        roomUsers[roomId].push({
          userId: socket.user._id.toString(),
          username: socket.user.username,
          socketId: socket.id,
          online: true,
          avatar: avatar || null,
        });
      } else {
        existingUser.socketId = socket.id;
        existingUser.online = true;
        if (avatar) existingUser.avatar = avatar;
      }

      // Send current users list to all in room
      io.to(roomId).emit("room-users", roomUsers[roomId]);

      // Notify others
      socket.to(roomId).emit("user-joined", {
        userId: socket.user._id.toString(),
        username: socket.user.username,
      });

      // Send system message
      socket.to(roomId).emit("system-message", {
        message: `${socket.user.username} joined the room`,
        timestamp: Date.now(),
      });

      // Send existing whiteboard data
      try {
        const wb = await Whiteboard.findOne({ roomId });
        if (wb && wb.strokes.length > 0) {
          socket.emit("board-state", wb.strokes);
        }
      } catch (err) {
        console.error("Error loading whiteboard:", err);
      }
    });

    socket.on("leave-room", (roomId) => {
      handleLeaveRoom(socket, roomId, io);
    });

    // ===== DRAWING EVENTS =====

    socket.on("draw", async ({ roomId, strokeData }) => {
      // Broadcast to others in room
      socket.to(roomId).emit("draw", strokeData);

      // Persist stroke to DB
      try {
        await Whiteboard.findOneAndUpdate(
          { roomId },
          { $push: { strokes: strokeData } },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error("Error saving stroke:", err);
      }
    });

    socket.on("clear-board", async (roomId) => {
      socket.to(roomId).emit("clear-board");

      try {
        await Whiteboard.findOneAndUpdate(
          { roomId },
          { strokes: [] },
          { upsert: true }
        );
      } catch (err) {
        console.error("Error clearing board:", err);
      }
    });

    socket.on("undo", ({ roomId, strokeIndex }) => {
      socket.to(roomId).emit("undo", { strokeIndex });
    });

    // ===== CHAT EVENTS =====

    socket.on("send-message", async (data) => {
      const msg = {
        userId: data.userId,
        username: data.username,
        message: data.message,
        timestamp: Date.now(),
      };

      // Broadcast to all in room (including sender)
      io.to(data.roomId).emit("chat-message", msg);

      // Save to DB
      try {
        await ChatMessage.create({
          roomId: data.roomId,
          userId: data.userId,
          username: data.username,
          message: data.message,
        });
      } catch (err) {
        console.error("Error saving message:", err);
      }
    });

    // ===== GAME EVENTS =====

    socket.on("guess-word", (data) => {
      const game = games[data.roomId];

      if (!game || game.status !== "playing") {
        // Not in game mode, treat as normal chat
        const msg = {
          userId: data.userId,
          username: data.username,
          message: data.message,
          timestamp: Date.now(),
        };
        io.to(data.roomId).emit("chat-message", msg);
        return;
      }

      // Check if the guess is correct
      const guess = data.message.toLowerCase().trim();
      const word = game.currentWord.toLowerCase().trim();

      if (guess === word) {
        // Correct guess!
        const guesserScore = Math.max(10, 50 - (60 - game.timeLeft));
        const drawerScore = 10;

        // Update scores in memory
        const guesserEntry = game.scores.find(
          (s) => s.userId === data.userId
        );
        if (guesserEntry) guesserEntry.score += guesserScore;

        const drawerEntry = game.scores.find(
          (s) => s.userId === game.currentDrawer
        );
        if (drawerEntry) drawerEntry.score += drawerScore;

        game.correctGuesses.push(data.userId);

        io.to(data.roomId).emit("correct-guess", {
          username: data.username,
          scores: game.scores,
        });

        // Update stats in MongoDB asynchronously
        User.findByIdAndUpdate(data.userId, {
          $inc: { correctGuesses: 1, totalScore: guesserScore }
        }).catch(err => console.error(err));

        User.findByIdAndUpdate(game.currentDrawer, {
          $inc: { totalScore: drawerScore }
        }).catch(err => console.error(err));

        // Check if all non-drawers have guessed
        const nonDrawerCount = game.players.filter(
          (p) => p.userId !== game.currentDrawer
        ).length;
        if (game.correctGuesses.length >= nonDrawerCount) {
          endRound(data.roomId, io);
        }
      } else {
        // Wrong guess, show as chat (but hide if it's close)
        const msg = {
          userId: data.userId,
          username: data.username,
          message: data.message,
          timestamp: Date.now(),
        };
        io.to(data.roomId).emit("chat-message", msg);
      }
    });

    socket.on("start-game", (roomId) => {
      const users = roomUsers[roomId];
      if (!users || users.length < 2) return;

      const game = {
        roomId,
        players: users.map((u) => ({ userId: u.userId, username: u.username })),
        scores: users.map((u) => ({
          userId: u.userId,
          username: u.username,
          score: 0,
        })),
        round: 1,
        maxRounds: 3,
        currentDrawerIndex: 0,
        currentDrawer: users[0].userId,
        currentWord: "",
        status: "selecting", // selecting, playing, ended
        correctGuesses: [],
        timeLeft: 60,
        timer: null,
      };

      games[roomId] = game;

      io.to(roomId).emit("game-started", {
        round: game.round,
        maxRounds: game.maxRounds,
        scores: game.scores,
      });

      // Send word options to drawer
      const drawerSocket = findSocketByUserId(io, users[0].userId, roomId);
      if (drawerSocket) {
        drawerSocket.emit("select-word", getRandomWords(3));
      }
    });

    socket.on("select-word", ({ roomId, word }) => {
      const game = games[roomId];
      if (!game) return;

      game.currentWord = word;
      game.status = "playing";
      game.correctGuesses = [];
      game.timeLeft = 60;

      // Initialize hint array
      game.hintArray = word.split("").map((ch) => (ch === " " ? " " : "_"));

      // Send hint to guessers, full word to drawer
      const hint = game.hintArray.join("");
      io.to(roomId).emit("word-selected", {
        hint,
        drawer: game.currentDrawer,
      });

      // Send full word to drawer
      const drawerSocket = findSocketByUserId(io, game.currentDrawer, roomId);
      if (drawerSocket) {
        drawerSocket.emit("drawer-word", word);
      }

      // Clear the board for new round
      io.to(roomId).emit("clear-board");

      // Start timer
      game.timer = setInterval(() => {
        game.timeLeft--;
        io.to(roomId).emit("timer", game.timeLeft);

        // Auto hint system: reveal a letter every 15 seconds
        if (game.timeLeft > 0 && game.timeLeft % 15 === 0 && game.hintArray.includes("_")) {
          const unrevealedIndices = [];
          game.hintArray.forEach((char, index) => {
            if (char === "_") unrevealedIndices.push(index);
          });

          // Leave at least 1 letter hidden
          if (unrevealedIndices.length > 1) {
            const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
            game.hintArray[randomIndex] = game.currentWord[randomIndex];
            io.to(roomId).emit("hint-update", game.hintArray.join(""));
          }
        }

        if (game.timeLeft <= 0) {
          endRound(roomId, io);
        }
      }, 1000);
    });

    // ===== REACTION EVENTS =====

    socket.on("reaction", ({ roomId, type, userId, username }) => {
      if (!roomReactions[roomId]) {
        roomReactions[roomId] = { thumbsUp: [], thumbsDown: [] };
      }

      const reactions = roomReactions[roomId];
      const opposite = type === 'thumbsUp' ? 'thumbsDown' : 'thumbsUp';

      // Remove from opposite list if present
      reactions[opposite] = reactions[opposite].filter(r => r.userId !== userId);

      // Toggle: add or remove from current list
      const existing = reactions[type].findIndex(r => r.userId === userId);
      let added = false;
      if (existing !== -1) {
        reactions[type].splice(existing, 1);
      } else {
        reactions[type].push({ userId, username });
        added = true;
      }

      // Broadcast updated reactions to all in room
      io.to(roomId).emit("reaction-update", reactions);

      // Notify all users about the reaction (only when adding, not removing)
      if (added) {
        io.to(roomId).emit("reaction-notify", { username, type, userId });
      }
    });

    // ===== KICK PLAYER =====
    socket.on("kick-player", async ({ roomId, targetUserId }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room || room.host.toString() !== socket.user._id.toString()) {
          return; // Only host can kick
        }

        const targetSocket = findSocketByUserId(io, targetUserId, roomId);
        if (targetSocket) {
          targetSocket.emit("you-were-kicked");
          handleLeaveRoom(targetSocket, roomId, io);
        }
      } catch (err) {
        console.error("Kick player error:", err);
      }
    });

    // ===== WEBRTC SIGNALING =====
    socket.on("webrtc-offer", ({ targetUserId, offer }) => {
      const targetSocket = findSocketByUserId(io, targetUserId, socket.roomId);
      if (targetSocket) {
        targetSocket.emit("webrtc-offer", {
          senderId: socket.user._id.toString(),
          offer,
        });
      }
    });

    socket.on("webrtc-answer", ({ targetUserId, answer }) => {
      const targetSocket = findSocketByUserId(io, targetUserId, socket.roomId);
      if (targetSocket) {
        targetSocket.emit("webrtc-answer", {
          senderId: socket.user._id.toString(),
          answer,
        });
      }
    });

    socket.on("webrtc-ice-candidate", ({ targetUserId, candidate }) => {
      const targetSocket = findSocketByUserId(io, targetUserId, socket.roomId);
      if (targetSocket) {
        targetSocket.emit("webrtc-ice-candidate", {
          senderId: socket.user._id.toString(),
          candidate,
        });
      }
    });

    // ===== DISCONNECT =====

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.user.username);
      if (socket.roomId) {
        handleLeaveRoom(socket, socket.roomId, io);
      }
    });
  });
};

function handleLeaveRoom(socket, roomId, io) {
  socket.leave(roomId);
  const userId = socket.user._id.toString();

  if (roomUsers[roomId]) {
    roomUsers[roomId] = roomUsers[roomId].filter(
      (u) => u.userId !== userId
    );

    io.to(roomId).emit("room-users", roomUsers[roomId]);
    io.to(roomId).emit("user-left", { userId });
    io.to(roomId).emit("system-message", {
      message: `${socket.user.username} left the room`,
      timestamp: Date.now(),
    });

    // ===== Handle mid-game disconnect =====
    const game = games[roomId];
    if (game) {
      const wasDrawer = game.currentDrawer === userId;

      // Remove the player from the game's player list
      game.players = game.players.filter(p => p.userId !== userId);

      // If fewer than 2 players remain, end the game
      if (game.players.length < 2) {
        clearInterval(game.timer);
        io.to(roomId).emit("game-ended", { scores: game.scores });

        // Update stats
        if (game.scores.length > 0) {
          const playerIds = game.scores.map(p => p.userId);
          User.updateMany({ _id: { $in: playerIds } }, { $inc: { gamesPlayed: 1 } })
            .catch(err => console.error(err));
          const winner = game.scores.reduce((max, obj) => (obj.score > max.score ? obj : max), game.scores[0]);
          if (winner.score > 0) {
            User.findByIdAndUpdate(winner.userId, { $inc: { gamesWon: 1 } })
              .catch(err => console.error(err));
          }
        }
        delete games[roomId];
      } else if (wasDrawer) {
        // If the drawer left, end the current round immediately and move to next turn
        clearInterval(game.timer);
        io.to(roomId).emit("round-end", {
          word: game.currentWord || '???',
          scores: game.scores,
        });

        // Adjust drawer index since we removed a player before this index
        if (game.currentDrawerIndex >= game.players.length) {
          game.currentDrawerIndex = 0;
          game.round++;

          if (game.round > game.maxRounds) {
            io.to(roomId).emit("game-ended", { scores: game.scores });
            const playerIds = game.scores.map(p => p.userId);
            User.updateMany({ _id: { $in: playerIds } }, { $inc: { gamesPlayed: 1 } })
              .catch(err => console.error(err));
            if (game.scores.length > 0) {
              const winner = game.scores.reduce((max, obj) => (obj.score > max.score ? obj : max), game.scores[0]);
              if (winner.score > 0) {
                User.findByIdAndUpdate(winner.userId, { $inc: { gamesWon: 1 } })
                  .catch(err => console.error(err));
              }
            }
            delete games[roomId];
            return;
          }
        }

        // Move to next turn after short delay
        setTimeout(() => {
          if (!games[roomId]) return;
          game.currentDrawer = game.players[game.currentDrawerIndex].userId;
          game.status = "selecting";
          game.correctGuesses = [];

          io.to(roomId).emit("next-turn", {
            round: game.round,
            maxRounds: game.maxRounds,
            scores: game.scores,
          });

          const drawerSocket = findSocketByUserId(io, game.currentDrawer, roomId);
          if (drawerSocket) {
            drawerSocket.emit("select-word", getRandomWords(3));
          }
        }, 2000);
      }
    }

    // Clean up empty rooms after a grace period
    if (roomUsers[roomId].length === 0) {
      console.log(`Room ${roomId} is empty. Scheduling cleanup...`);
      roomDeleteTimeouts[roomId] = setTimeout(async () => {
        if (!roomUsers[roomId] || roomUsers[roomId].length === 0) {
          delete roomUsers[roomId];
          delete roomReactions[roomId];
          if (games[roomId]) {
            clearInterval(games[roomId].timer);
            delete games[roomId];
          }

          try {
            await Room.deleteOne({ roomId });
            await Whiteboard.deleteOne({ roomId });
            await ChatMessage.deleteMany({ roomId });
            console.log(`Room ${roomId} cleaned up from DB due to inactivity`);
          } catch (err) {
            console.error("Room cleanup error:", err);
          }
        }
        delete roomDeleteTimeouts[roomId];
      }, 10000);
    }
  }
}

function endRound(roomId, io) {
  const game = games[roomId];
  if (!game) return;

  clearInterval(game.timer);

  io.to(roomId).emit("round-end", {
    word: game.currentWord,
    scores: game.scores,
  });

  // Move to next turn after a delay
  setTimeout(() => {
    game.currentDrawerIndex++;

    // Check if round is over (all players have drawn)
    if (game.currentDrawerIndex >= game.players.length) {
      game.round++;
      game.currentDrawerIndex = 0;

      // Check if game is over
      if (game.round > game.maxRounds) {
        io.to(roomId).emit("game-ended", {
          scores: game.scores,
        });
        clearInterval(game.timer);

        // Update gamesPlayed for everyone and gamesWon for the winner
        if (game.players.length > 0) {
          const playerIds = game.players.map(p => p.userId);
          User.updateMany({ _id: { $in: playerIds } }, { $inc: { gamesPlayed: 1 } })
            .catch(err => console.error(err));

          // Find winner (highest score)
          if (game.scores.length > 0) {
            const winner = game.scores.reduce((max, obj) => (obj.score > max.score ? obj : max), game.scores[0]);
            if (winner.score > 0) { // only count as win if they actually scored
              User.findByIdAndUpdate(winner.userId, { $inc: { gamesWon: 1 } })
                .catch(err => console.error(err));
            }
          }
        }

        delete games[roomId];
        return;
      }
    }

    game.currentDrawer = game.players[game.currentDrawerIndex].userId;
    game.status = "selecting";
    game.correctGuesses = [];

    io.to(roomId).emit("next-turn", {
      round: game.round,
      maxRounds: game.maxRounds,
      scores: game.scores,
    });

    // Send word options to new drawer
    const drawerSocket = findSocketByUserId(
      io,
      game.currentDrawer,
      roomId
    );
    if (drawerSocket) {
      drawerSocket.emit("select-word", getRandomWords(3));
    }
  }, 3000);
}

function findSocketByUserId(io, userId, roomId) {
  const room = io.sockets.adapter.rooms.get(roomId);
  if (!room) return null;

  for (const socketId of room) {
    const s = io.sockets.sockets.get(socketId);
    if (s && s.user && s.user._id.toString() === userId) {
      return s;
    }
  }
  return null;
}