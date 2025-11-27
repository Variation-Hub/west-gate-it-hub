import mongoose from "mongoose";

const supportModel = new mongoose.Schema({
    message: {
        type: String,
        required: true,
        trim: true,
    },
    messageType: {
        type: String,
        enum: ['text', 'file', 'audio', 'video']
    },
    messageFor: {
        type: String,
        enum: ['Admin', 'User'],
        default: 'User'
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    file: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false, minimize: false });

supportModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Support', supportModel);