import mongoose from "mongoose";

const industryModel = new mongoose.Schema({
    industry: {
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

industryModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('industry', industryModel);