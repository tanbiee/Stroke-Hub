import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes.js';
import roomRoutes from './routes/room.routes.js';
import { socketHandler } from './sockets/socketHandler.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
const server = http.createServer(app);

// ===== CORS Configuration =====
// Allow ALL origins for now to eliminate CORS issues during deployment
const corsOptions = {
    origin: true, // Reflects the request origin — allows ALL origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

// CORS middleware — must be FIRST
app.use(cors(corsOptions));

// Cross-Origin headers for Google OAuth popup
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});

const io = new Server(server, { cors: corsOptions });

// Middleware
app.use(express.json({ limit: '10mb' }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/room", roomRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Socket handler
socketHandler(io);

// Start server — ALWAYS start listening even if MongoDB fails,
// so Render doesn't get a "port scan timeout" error
const startServer = async () => {
    try {
        if (!MONGO_URI) {
            console.error('WARNING: MONGO_URI is not set! Check your environment variables.');
        } else {
            await mongoose.connect(MONGO_URI);
            console.log('Connected to MongoDB');
        }
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
    }

    // Always start listening on the port
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`CLIENT_URL: ${CLIENT_URL}`);
    });
};

startServer();