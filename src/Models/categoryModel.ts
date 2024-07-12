import mongoose from "mongoose";

const categoryModel = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        trim: true,
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

categoryModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('category', categoryModel);