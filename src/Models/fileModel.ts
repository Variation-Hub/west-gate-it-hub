import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    supplierId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    expertise: {
        type: String,
        required: true,
        trim: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    key: {
        type: String, // This is required for deletion from Backblaze B2
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false, minimize: false });

export default mongoose.model("File", fileSchema);
