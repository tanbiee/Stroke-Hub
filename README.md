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

### Easy Start (Recommended)
You can start both the frontend and backend servers simultaneously from the root directory with one command using `concurrently`:
1. Install all dependencies across both folders:
   ```bash
   npm run install:all
   ```
2. Start the application:
   ```bash
   npm run dev
   ```

### Manual Start (Alternative)
**Backend:**
1. Navigate to the `backend` folder `cd backend`
2. Install dependencies `npm install`
3. Create a `.env` file with your environment variables (MongoDB URI, JWT Secret).
4. Run the server `npm run dev`

**Frontend:**
1. Navigate to the `frontend` folder `cd frontend`
2. Install dependencies `npm install`
3. Run the Vite development server `npm run dev`

## Folder Structure 📂

- `/backend/` - Node.js & Express server, Socket.io event handlers, and MongoDB models.
- `/frontend/` - React frontend powered by Vite, containing components, hooks (`useWebRTC`), pages, and styles.

---

## Deployment Guide 🌍

For detailed, step-by-step instructions on deploying the backend to Render and the frontend to Vercel, please see the [DEPLOYMENT.md](./DEPLOYMENT.md) guide.

## License 📜

Built with ❤️ by the Antigravity Team & Shalini Singh.
