import mongoose from "mongoose";

const caseStudyModel = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: ""
    },
    category: {
        type: String,
        trim: true,
        default: ""
    },
    subCategory: {
        type: String,
        trim: true,
        default: ""
    },
    verify: {
        type: Boolean,
        default: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: null
    },
    industry: {
        type: String,
        default: null,
        trim: true
    },
    type: {
        type: String,
        default: null,
        trim: true
    },
    description: {
        type: String,
        default: null,
        trim: true
    },
    technologies: {
        type: String,
        default: null,
        trim: true
    },
    maintenance: {
        type: String,
        default: null,
        trim: true
    },
    contractDuration: {
        type: String,
        default: null,
        trim: true
    },
    contractValue: {
        type: String,
        default: null,
        trim: true
    },
    resourcesUsed: {
        type: String,
        default: null,
        trim: true
    },
    clientName: {
        type: String,
        default: null,
        trim: true
    },
    link: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
        default: null
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

caseStudyModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('CaseStudyModel', caseStudyModel);