import mongoose from "mongoose";

const caseStudyModel = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    subCategory: {
        type: String,
        required: false,
        trim: true
    },
    link: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
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
    projectApplicationName: {
        type: String,
        default: null,
        trim: true
    },
    domainCategoryIndustry: {
        type: String,
        default: null,
        trim: true
    },
    type: {
        type: String,
        default: null,
        trim: true
    },
    descriptionTechnologies: {
        type: String,
        default: null,
        trim: true
    },
    maintenanceContractDuration: {
        type: String,
        default: null,
        trim: true
    },
    contractValue: {
        type: Number,
        default: 0,
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