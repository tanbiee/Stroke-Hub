# StrokeHub 🎨💅✨

StrokeHub is a real-time multiplayer drawing and word-guessing game (inspired by Scribble.io) with a modern Gen-Z twist, glassmorphism UI, and built-in native WebRTC Voice Chat!

## Features 🚀

- **Real-Time Multiplayer:** Powered by Socket.io for instantaneous drawing and chat syncing.
- **WebRTC Voice Chat:** Built-in peer-to-peer voice chat with mute/unmute and speaking indicator rings. No third-party servers required!
- **Advanced Drawing Tools:** Freehand, Line, Rectangle, Circle, and an optimized Flood Fill bucket tool.
- **Hint System:** Guesser hints automatically reveal letters as the timer ticks down.
- **Customizable Avatars:** Build and save your own avatar profile.
- **In-Room Leaderboard:** A sleek podium modal showing the top players at the end of the match.
- **Confetti Drops:** Visual celebrations for guessing words correctly and winning rounds!
- **Host Controls:** Kick disruptive players from your room.

## Tech Stack 💻

- **Frontend:** React (Vite), React Icons, Socket.io-client, WebRTC API
- **Backend:** Node.js, Express, Socket.io, WebRTC Signaling
- **Database:** MongoDB (Mongoose)

## How to Run Locally 🛠️

### 1. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your environment variables (MongoDB URI, JWT Secret).
4. Run the server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```

## Folder Structure 📂

- `/backend/` - Node.js & Express server, Socket.io event handlers, and MongoDB models.
- `/frontend/` - React frontend powered by Vite, containing components, hooks (`useWebRTC`), pages, and styles.

## License 📜

Built with ❤️ by the Antigravity Team & Shalini Singh.
