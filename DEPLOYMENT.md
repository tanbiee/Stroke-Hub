# StrokeHub Deployment Guide 🌍

This guide takes you step-by-step through deploying the backend to Render and the frontend to Vercel.

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
