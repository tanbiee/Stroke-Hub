import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import Canvas from '../components/Canvas';
import Toolbar from '../components/Toolbar';
import Chat from '../components/Chat';
import UserPresence from '../components/UserPresence';
import GameControls from '../components/GameControls';
import Confetti from '../components/Confetti';
import WordHint from '../components/WordHint';
import Avatar from '../components/Avatar';
import { getSavedAvatar } from '../components/avatarParts';
import useWebRTC from '../hooks/useWebRTC';
import useSoundEffects from '../hooks/useSoundEffects';
import axios from 'axios';
import API_BASE from '../config';
import { FiArrowLeft, FiSun, FiMoon, FiUsers, FiCopy, FiCheck, FiX } from 'react-icons/fi';
import './Room.css';

const API_URL = `${API_BASE}/api/room`;

export default function Room() {
    const { roomId } = useParams();
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Room state
    const [roomData, setRoomData] = useState(null);
    const [users, setUsers] = useState([]);
    const [isHost, setIsHost] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [showUsers, setShowUsers] = useState(false);

    // Drawing state
    const [tool, setTool] = useState('pencil');
    const [color, setColor] = useState('#ffffff');
    const [brushSize, setBrushSize] = useState(3);
    const [strokes, setStrokes] = useState([]);
    const [undoneStrokes, setUndoneStrokes] = useState([]);

    // Game state
    const [gameState, setGameState] = useState(null); // null = no game, object = active game
    const [currentWord, setCurrentWord] = useState('');
    const [isDrawer, setIsDrawer] = useState(false);
    const [wordOptions, setWordOptions] = useState([]);
    const [scores, setScores] = useState([]);
    const [timer, setTimer] = useState(0);
    const [roundMessage, setRoundMessage] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // Canvas ref for snapshot
    const canvasRef = useRef(null);

    // WebRTC connection
    const { isMicOn, toggleMic, speakingUsers } = useWebRTC(socket, roomId, user, isConnected, users);

    // Sound effects
    const { playGameStart, playCorrectGuess, playConfetti, playTimerTick, playRoundEnd, playGameOver, playPlayerJoin, playYourTurn } = useSoundEffects();

    // Drawer tracking
    const [currentDrawerId, setCurrentDrawerId] = useState(null);

    // Fetch room data and join via API
    useEffect(() => {
        const fetchAndJoinRoom = async () => {
            try {
                // Join room in DB
                await axios.post(`${API_URL}/${roomId}/join`).catch(() => { });
                // Fetch room data
                const res = await axios.get(`${API_URL}/${roomId}`);
                setRoomData(res.data);
                // Compare as strings since host is MongoDB ObjectId
                setIsHost(res.data.host?.toString() === user?.id);
            } catch (err) {
                setError('Room not found or access denied');
            }
        };
        fetchAndJoinRoom();
    }, [roomId, user]);

    // Socket events
    useEffect(() => {
        if (!socket || !isConnected) return;

        // Join the room with avatar config
        socket.emit('join-room', { roomId, avatar: getSavedAvatar() });

        // User list updates
        const handleRoomUsers = (userList) => {
            setUsers(userList);
        };
        const handleUserJoined = ({ userId, username }) => {
            setUsers(prev => {
                if (prev.find(u => u.userId === userId)) return prev;
                return [...prev, { userId, username, online: true }];
            });
            playPlayerJoin();
        };
        const handleUserLeft = ({ userId }) => {
            setUsers(prev => prev.filter(u => u.userId !== userId));
        };

        // Drawing events from others
        const handleRemoteDraw = (strokeData) => {
            setStrokes(prev => [...prev, strokeData]);
        };
        const handleClearBoard = () => {
            setStrokes([]);
            setUndoneStrokes([]);
        };
        const handleRemoteUndo = ({ strokeIndex }) => {
            setStrokes(prev => prev.slice(0, strokeIndex));
        };
        const handleBoardState = (existingStrokes) => {
            if (existingStrokes && existingStrokes.length > 0) {
                setStrokes(existingStrokes);
            }
        };

        // Game events
        const handleGameStarted = (state) => {
            setGameState(state);
            setScores(state.scores || []);
            setRoundMessage('');
            setStrokes([]);
            setUndoneStrokes([]);
            if (state.drawer) setCurrentDrawerId(state.drawer);
            playGameStart();
        };
        const handleSelectWordOptions = (options) => {
            setWordOptions(options);
            setIsDrawer(true);
            playYourTurn();
        };
        const handleWordSelected = ({ hint, drawer }) => {
            setCurrentWord(hint);
            setIsDrawer(drawer === user?.id);
            setCurrentDrawerId(drawer);
            setWordOptions([]);
            setStrokes([]);
            setUndoneStrokes([]);
        };
        const handleDrawerWord = (word) => {
            setCurrentWord(word);
        };
        const handleCorrectGuess = ({ username, scores: newScores }) => {
            setScores(newScores);
            setRoundMessage(`${username} guessed correctly! 🎉`);
            playCorrectGuess();

            if (username === user?.username) {
                setShowConfetti(true);
                playConfetti();
                setTimeout(() => setShowConfetti(false), 3500);
            }

            setTimeout(() => setRoundMessage(''), 3000);
        };
        const handleRoundEnd = ({ word, scores: newScores }) => {
            setScores(newScores);
            setCurrentWord('');
            setIsDrawer(false);
            setCurrentDrawerId(null);
            setRoundMessage(`The word was: ${word}`);
            playRoundEnd();
        };
        const handleNextTurn = (state) => {
            setGameState(state);
            setRoundMessage('');
            setStrokes([]);
            setUndoneStrokes([]);
            setCurrentWord('');
            setIsDrawer(false);
            if (state.drawer) setCurrentDrawerId(state.drawer);
        };
        const handleGameEnded = ({ scores: finalScores }) => {
            setScores(finalScores);
            setGameState(null);
            setCurrentWord('');
            setIsDrawer(false);
            setRoundMessage('Game Over! 🏆');
            playGameOver();

            // Show confetti for the winner
            if (finalScores && finalScores.length > 0) {
                const winner = finalScores.reduce((max, obj) => (obj.score > max.score ? obj : max), finalScores[0]);
                if (winner.userId === user?.id && winner.score > 0) {
                    setShowConfetti(true);
                    playConfetti();
                    setTimeout(() => setShowConfetti(false), 6000);
                }
            }
            setCurrentDrawerId(null);
            setShowLeaderboard(true);
        };
        const handleTimer = (time) => {
            setTimer(time);
            if (time > 0 && time <= 5) playTimerTick();
        };
        const handleHintUpdate = (newHint) => {
            setCurrentWord(prev => {
                // If the current word doesn't have underscores, it means we are the drawer 
                // who sees the full word (or the word is fully guessed). Don't overwrite it.
                if (prev && !prev.includes('_')) return prev;
                return newHint;
            });
        };
        const handleKicked = () => {
            alert("You have been kicked from the room by the host.");
            navigate('/dashboard');
        };

        // Real-time drawing from others
        const handleRemoteDrawing = (pointData) => {
            if (canvasRef.current && canvasRef.current.drawRemotePoint) {
                canvasRef.current.drawRemotePoint(pointData);
            }
        };

        // Mid-game join sync
        const handleGameStateSync = (state) => {
            setGameState({ round: state.round, maxRounds: state.maxRounds, scores: state.scores });
            setScores(state.scores || []);
            if (state.drawer) {
                setCurrentDrawerId(state.drawer);
                setIsDrawer(state.drawer === user?.id);
            }
            if (state.hint) setCurrentWord(state.hint);
            if (state.timeLeft) setTimer(state.timeLeft);
        };

        // Scores update (when new player joins mid-game)
        const handleScoresUpdate = (newScores) => {
            setScores(newScores);
        };

        socket.on('room-users', handleRoomUsers);
        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);
        socket.on('draw', handleRemoteDraw);
        socket.on('clear-board', handleClearBoard);
        socket.on('undo', handleRemoteUndo);
        socket.on('board-state', handleBoardState);
        socket.on('game-started', handleGameStarted);
        socket.on('select-word', handleSelectWordOptions);
        socket.on('word-selected', handleWordSelected);
        socket.on('drawer-word', handleDrawerWord);
        socket.on('correct-guess', handleCorrectGuess);
        socket.on('round-end', handleRoundEnd);
        socket.on('next-turn', handleNextTurn);
        socket.on('game-ended', handleGameEnded);
        socket.on('timer', handleTimer);
        socket.on('hint-update', handleHintUpdate);
        socket.on('you-were-kicked', handleKicked);
        socket.on('drawing', handleRemoteDrawing);
        socket.on('game-state-sync', handleGameStateSync);
        socket.on('scores-update', handleScoresUpdate);

        return () => {
            socket.emit('leave-room', roomId);
            socket.off('room-users', handleRoomUsers);
            socket.off('user-joined', handleUserJoined);
            socket.off('user-left', handleUserLeft);
            socket.off('draw', handleRemoteDraw);
            socket.off('clear-board', handleClearBoard);
            socket.off('undo', handleRemoteUndo);
            socket.off('board-state', handleBoardState);
            socket.off('game-started', handleGameStarted);
            socket.off('select-word', handleSelectWordOptions);
            socket.off('word-selected', handleWordSelected);
            socket.off('drawer-word', handleDrawerWord);
            socket.off('correct-guess', handleCorrectGuess);
            socket.off('round-end', handleRoundEnd);
            socket.off('next-turn', handleNextTurn);
            socket.off('game-ended', handleGameEnded);
            socket.off('timer', handleTimer);
            socket.off('hint-update', handleHintUpdate);
            socket.off('you-were-kicked', handleKicked);
            socket.off('drawing', handleRemoteDrawing);
            socket.off('game-state-sync', handleGameStateSync);
            socket.off('scores-update', handleScoresUpdate);
        };
    }, [socket, isConnected, roomId, user, navigate]);

    // Drawing handlers
    // Note: socket.to() on backend broadcasts to everyone EXCEPT sender,
    // so we must add the stroke locally here for the drawer's own canvas.
    const handleDraw = useCallback((strokeData) => {
        if (socket && isConnected) {
            socket.emit('draw', { roomId, strokeData });
        }
        setStrokes(prev => [...prev, strokeData]);
        setUndoneStrokes([]);
    }, [socket, isConnected, roomId]);

    // Incremental drawing — emits point-by-point for real-time sync
    const handleDrawing = useCallback((pointData) => {
        if (socket && isConnected) {
            socket.emit('drawing', { roomId, point: pointData });
        }
    }, [socket, isConnected, roomId]);

    const handleUndo = useCallback(() => {
        if (strokes.length === 0) return;
        const lastStroke = strokes[strokes.length - 1];
        setStrokes(prev => prev.slice(0, -1));
        setUndoneStrokes(prev => [...prev, lastStroke]);
        if (socket && isConnected) {
            socket.emit('undo', { roomId, strokeIndex: strokes.length - 1 });
        }
    }, [strokes, socket, isConnected, roomId]);

    const handleRedo = useCallback(() => {
        if (undoneStrokes.length === 0) return;
        const strokeToRedo = undoneStrokes[undoneStrokes.length - 1];
        setUndoneStrokes(prev => prev.slice(0, -1));
        setStrokes(prev => [...prev, strokeToRedo]);
        if (socket && isConnected) {
            socket.emit('draw', { roomId, strokeData: strokeToRedo });
        }
    }, [undoneStrokes, socket, isConnected, roomId]);

    const handleClearBoard = useCallback(() => {
        setStrokes([]);
        setUndoneStrokes([]);
        if (socket && isConnected) {
            socket.emit('clear-board', roomId);
        }
    }, [socket, isConnected, roomId]);

    const handleSaveSnapshot = useCallback(() => {
        const canvasEl = canvasRef.current?.canvas || canvasRef.current;
        if (canvasEl) {
            const link = document.createElement('a');
            link.download = `strokehub-${roomId}-${Date.now()}.png`;
            link.href = canvasEl.toDataURL('image/png');
            link.click();
        }
    }, [roomId]);

    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Game handlers
    const handleStartGame = () => {
        if (socket && isConnected) {
            socket.emit('start-game', roomId);
        }
    };

    const handleSelectWord = (word) => {
        if (socket && isConnected) {
            socket.emit('select-word', { roomId, word });
            setWordOptions([]);
        }
    };

    const handleKickPlayer = (targetUserId) => {
        if (socket && isConnected && isHost) {
            socket.emit('kick-player', { roomId, targetUserId });
        }
    };

    if (error) {
        return (
            <div className="room-error">
                <h2>😕 {error}</h2>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const canDraw = !gameState || isDrawer;

    return (
        <div className="room-page">
            {showConfetti && <Confetti />}
            {/* Room Header */}
            <header className="room-header">
                <div className="room-header-left">
                    <button className="btn-icon" onClick={() => navigate('/dashboard')} title="Back">
                        <FiArrowLeft />
                    </button>
                    <div className="room-id-chip" onClick={handleCopyRoomId} title="Click to copy">
                        <span>Room: <strong>{roomId}</strong></span>
                        {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                    </div>
                    {!isConnected && <span className="connection-status offline">Reconnecting...</span>}
                    {isConnected && <span className="connection-status online">Connected</span>}
                </div>

                <div className="room-header-center">
                    {currentWord && <WordHint word={currentWord} isDrawer={isDrawer} />}
                    {timer > 0 && <div className="timer-display">{timer}s</div>}
                    {roundMessage && <div className="round-message animate-fade-in">{roundMessage}</div>}
                </div>

                <div className="room-header-right">
                    <button className="btn-icon" onClick={() => setShowUsers(!showUsers)} title="Players">
                        <FiUsers />
                        <span className="user-count-badge">{users.length}</span>
                    </button>
                    <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
                        {theme === 'dark' ? <FiSun /> : <FiMoon />}
                    </button>
                </div>
            </header>

            {/* Word Selection Modal */}
            {wordOptions.length > 0 && (
                <div className="word-selection-overlay">
                    <div className="word-selection-modal glass-card animate-fade-in">
                        <h3>Choose a word to draw!</h3>
                        <div className="word-options">
                            {wordOptions.map((word, i) => (
                                <button key={i} className="btn btn-secondary word-option" onClick={() => handleSelectWord(word)}>
                                    {word}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Layout */}
            <div className="room-body">
                {/* Users Sidebar (collapsible) */}
                {showUsers && (
                    <aside className="room-sidebar-left animate-slide-left">
                        <UserPresence
                            users={users}
                            hostId={roomData?.host}
                            currentUserId={user?.id}
                            onKickPlayer={handleKickPlayer}
                            speakingUsers={speakingUsers}
                            isMicOn={isMicOn}
                            onToggleMic={toggleMic}
                            drawerId={currentDrawerId}
                        />
                        {scores.length > 0 && (
                            <div className="scoreboard">
                                <h4>Scoreboard</h4>
                                {[...scores].sort((a, b) => b.score - a.score).map((s, i) => (
                                    <div key={s.userId} className="score-entry">
                                        <span className="score-rank">#{i + 1}</span>
                                        <span className="score-name">
                                            {s.username} {s.userId === user?.id && <span className="you-badge">(You)</span>}
                                        </span>
                                        <span className="score-value">{s.score}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </aside>
                )}

                {/* Canvas Area */}
                <div className="room-canvas-area">
                    <Toolbar
                        tool={tool}
                        setTool={setTool}
                        color={color}
                        setColor={setColor}
                        brushSize={brushSize}
                        setBrushSize={setBrushSize}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        onClear={handleClearBoard}
                        onSave={handleSaveSnapshot}
                        canUndo={strokes.length > 0}
                        canRedo={undoneStrokes.length > 0}
                        canDraw={canDraw}
                    />
                    <Canvas
                        ref={canvasRef}
                        tool={tool}
                        color={color}
                        brushSize={brushSize}
                        strokes={strokes}
                        onDraw={handleDraw}
                        onDrawing={handleDrawing}
                        canDraw={canDraw}
                    />
                </div>

                {/* Chat Sidebar */}
                <aside className="room-sidebar-right">
                    <GameControls
                        isHost={isHost}
                        gameState={gameState}
                        onStartGame={handleStartGame}
                        userCount={users.length}
                    />
                    <Chat
                        roomId={roomId}
                        socket={socket}
                        isConnected={isConnected}
                        user={user}
                        gameState={gameState}
                        isDrawer={isDrawer}
                        users={users}
                    />
                </aside>
            </div>

            {/* In-Game Leaderboard Modal */}
            {showLeaderboard && (
                <div className="leaderboard-modal-overlay">
                    <div className="leaderboard-modal glass-card animate-fade-in">
                        <div className="leaderboard-modal-header">
                            <h3>Match Results 🏆</h3>
                            <button className="btn-icon" onClick={() => setShowLeaderboard(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="podium-container">
                            {/* Render top 3 sorted by score */}
                            {[...scores].sort((a, b) => b.score - a.score).slice(0, 3).map((s, i) => (
                                <div key={s.userId} className={`podium-place place-${i + 1}`}>
                                    <div className="podium-avatar">
                                        <Avatar config={users.find(u => u.userId === s.userId)?.avatar || getSavedAvatar()} size={i === 0 ? 64 : 48} />
                                    </div>
                                    <div className="podium-rank">#{i + 1}</div>
                                    <div className="podium-name">
                                        {s.username} {s.userId === user?.id && <span className="you-badge">(You)</span>}
                                    </div>
                                    <div className="podium-score">{s.score} pts</div>
                                </div>
                            ))}
                        </div>
                        <div className="leaderboard-others">
                            {[...scores].sort((a, b) => b.score - a.score).slice(3).map((s, i) => (
                                <div key={s.userId} className="lb-other-item">
                                    <div className="lb-other-left">
                                        <span className="lb-other-rank">#{i + 4}</span>
                                        <span className="lb-other-name">
                                            {s.username} {s.userId === user?.id && <span className="you-badge">(You)</span>}
                                        </span>
                                    </div>
                                    <span className="lb-other-score">{s.score} pts</span>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-primary lb-close-btn" onClick={() => setShowLeaderboard(false)}>
                            Play Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
