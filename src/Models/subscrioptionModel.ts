import mongoose from "mongoose";

const subscriptionModel = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        trim: true
    },
    planDetail: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiredAt: {
        type: Date,
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

subscriptionModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Subscription', subscriptionModel);