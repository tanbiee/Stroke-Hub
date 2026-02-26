import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import User from "../model/User.model.js";

const router = express.Router();

// Get top 10 users by total score
router.get("/", verifyToken, async (req, res) => {
    try {
        const topUsers = await User.find({}, 'username avatar gamesPlayed gamesWon totalScore correctGuesses')
            .sort({ totalScore: -1 })
            .limit(10);

        res.status(200).json(topUsers);
    } catch (err) {
        res.status(500).json({ message: "Error fetching leaderboard", error: err.message });
    }
});

// Get current user's stats and rank
router.get("/me", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id, 'username avatar gamesPlayed gamesWon totalScore correctGuesses');
        if (!user) return res.status(404).json({ message: "User not found" });

        // Calculate rank by counting how many users have a higher score
        const higherCount = await User.countDocuments({ totalScore: { $gt: user.totalScore } });
        const rank = higherCount + 1;

        res.status(200).json({ user, rank });
    } catch (err) {
        res.status(500).json({ message: "Error fetching user stats", error: err.message });
    }
});

export default router;
