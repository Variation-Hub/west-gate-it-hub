import mongoose from "mongoose";

const supportChatModel = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    anonymousUserId: {
        type: String,
        required: false,
        trim: true,
    },
    userName: {
        type: String,
        required: false,
        trim: true,
    },
    userEmail: {
        type: String,
        required: false,
        trim: true,
    },
    userQuestion: {
        type: String,
        required: false,
        trim: true,
    },
    currentStep: {
        type: String,
        enum: ['initial', 'name', 'email', 'question', 'completed'],
        default: 'initial'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    messages: [{
        message: {
            type: String,
            required: true,
            trim: true,
        },
        isUser: {
            type: Boolean,
            default: false
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false, minimize: false });

supportChatModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('SupportChat', supportChatModel);
