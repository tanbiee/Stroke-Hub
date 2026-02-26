import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import Room from "../model/room.model.js";

const router = express.Router();


//create a room
router.post("/create", verifyToken, async (req, res) => {
    try {
        const { roomId } = req.body;
        console.log("[ROOM CREATE] Attempting to create room:", roomId, "by user:", req.user.id);
        const room = await Room.create({
            roomId,
            host: req.user.id,
            participants: [req.user.id],
        });
        console.log("[ROOM CREATE] Room saved successfully:", room.roomId, "DB _id:", room._id);

        res.status(201).json({ message: "Room created successfully", roomId: room.roomId });
    } catch (err) {
        console.error("[ROOM CREATE] ERROR:", err.message);
        res.status(500).json({ message: "Error creating room", error: err.message });
    }
});


//join a room
router.post("/:roomId/join", verifyToken, async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });
        if (!room) return res.status(404).json({ message: "Room not found" });

        // Check if already a participant
        if (!room.participants.includes(req.user.id)) {
            room.participants.push(req.user.id);
            await room.save();
        }

        res.status(200).json({ message: "Joined room", roomId: room.roomId });
    } catch (err) {
        res.status(500).json({ message: "Error joining room", error: err.message });
    }
});


//get a room 
router.get("/:roomId", verifyToken, async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });
        if (!room) return res.status(404).json({ message: "Room not found" });

        res.status(200).json({
            roomId: room.roomId,
            host: room.host.toString(),
            participants: room.participants.map(p => p.toString()),
        });
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching room", error: err.message });
    }
});


//delete a room (host only)
router.delete("/:roomId", verifyToken, async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });
        if (!room) return res.status(404).json({ message: "Room not found" });

        if (room.host.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only the host can delete this room" });
        }

        await Room.deleteOne({ roomId: req.params.roomId });
        res.status(200).json({ message: "Room deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting room", error: err.message });
    }
});

export default router;
