import mongoose from "mongoose";

const strokeSchema = new mongoose.Schema({
    type: String,
    color: String,
    size: Number,
    points: [{x: Number, y: Number}],
});


const whiteboardSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
    },
    strokes: [strokeSchema],
    
}, {timestamps: true})

export default mongoose.model("Whiteboard", whiteboardSchema);
