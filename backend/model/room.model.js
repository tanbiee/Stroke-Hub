import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    participants: {
        type: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    }
})

const Room = mongoose.model("Room", roomSchema);
export default Room;