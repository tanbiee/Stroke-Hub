import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        index: true,
    },
    userId: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
        maxlength: 500,
    },
    isCorrectGuess: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export default mongoose.model("ChatMessage", chatMessageSchema);
