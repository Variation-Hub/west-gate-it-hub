import mongoose from "mongoose";

const chatModel = new mongoose.Schema({
    message: {
        type: String,
        required: true,
        trim: true,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'file', 'audio', 'video']
    },
    mentionList: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User'
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

chatModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Chat', chatModel);