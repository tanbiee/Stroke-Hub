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

// Allow any localhost port during development
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || origin.startsWith('http://localhost')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
};

const io = new Server(server, { cors: corsOptions });

//middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // increased for image snapshots

//routes
app.use("/api/auth", authRoutes);
app.use("/api/room", roomRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

//socket handler
socketHandler(io);

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        })
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });