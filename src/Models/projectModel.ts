import mongoose from "mongoose";

const projectModel = new mongoose.Schema({
    projectName: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    industry: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    BOSID: {
        type: String,
        required: true,
        trim: true,
    },
    publishDate: {
        type: Date,
        default: Date.now,
    },
    submission: {
        type: Date,
        required: true,
    },
    link: {
        type: String,
        required: true,
        trim: true,
    },
    periodOfContractStart: {
        type: Date,
        required: true
    },
    periodOfContractEnd: {
        type: Date,
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    value: {
        type: Number,
        required: true,
        trim: true,
    },
    projectType: {
        type: String,
        required: true,
        trim: true,
    },
    website: {
        type: String,
        required: true,
        trim: true,
    },
    mailID: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    clientType: {
        type: String,
        required: true,
        trim: true,
    },
    clientName: {
        type: String,
        required: true,
        trim: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

projectModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Project', projectModel);