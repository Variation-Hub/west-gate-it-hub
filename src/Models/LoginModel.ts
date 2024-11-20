import mongoose from "mongoose";

const LoginModel = new mongoose.Schema({
    userId: {
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
}, { versionKey: false, minimize: false });

LoginModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('LoginModel', LoginModel);