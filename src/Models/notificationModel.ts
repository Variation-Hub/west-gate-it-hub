import mongoose from "mongoose";

const NotificationModel = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    discription: {
        type: String,
        required: true,
        trim: true,
    },
    read: {
        type: Boolean,
        required: true,
        default: false,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
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

NotificationModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Notification', NotificationModel);