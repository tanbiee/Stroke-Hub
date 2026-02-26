import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: function () {
            // Password is REQUIRED if they didn't sign up with Google
            return !this.googleId;
        }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined values to not violate unique index
    },
    role: {
        type: String,
        default: "participant",
    },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    correctGuesses: { type: Number, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now(),
    }
})

const User = mongoose.model("User", userSchema);
export default User;
