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

### Deploying the Backend (Render)
1. Go to [Render](https://render.com) and create a new **Web Service**.
2. Connect your GitHub repository (`Stroke-Hub`).
3. Set the **Root Directory** to `backend`.
4. Set the **Build Command** to `npm install`.
5. Set the **Start Command** to `npm start`.
6. Add the following **Environment Variables**:
   - `MONGO_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: A secure random string for tokens.
   - `PORT`: `3000` (Optional, Render assigns this automatically).
   - `CLIENT_URL`: The URL of your future Vercel frontend (e.g., `https://strokehub.vercel.app`).
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret.
7. Click **Deploy Web Service**. Copy the generated Render URL once it's live (e.g., `https://stroke-hub-backend.onrender.com`).

### Deploying the Frontend (Vercel)
1. Go to [Vercel](https://vercel.com) and click **Add New Project**.
2. Import your GitHub repository (`Stroke-Hub`).
3. In the project setup, click **Edit** next to Root Directory and select `frontend`.
4. Ensure the **Framework Preset** is automatically detected as `Vite`.
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your live backend Render URL (e.g., `https://stroke-hub-backend.onrender.com`).
6. Click **Deploy**.

### Finalizing Google OAuth for Production
Once both are deployed, you MUST update your Google Cloud Console to allow the live URLs:
1. Go back to your [Google Cloud Console Credentials page](https://console.cloud.google.com/apis/credentials).
2. Edit your OAuth 2.0 Client ID.
3. Under **Authorized JavaScript origins**, add your Vercel URL (e.g., `https://strokehub.vercel.app`).
4. Under **Authorized redirect URIs**, add the same Vercel URL.
5. Click **Save**. Google Login will now work in production!

## License 📜

Built with ❤️ by the Antigravity Team & Shalini Singh.
