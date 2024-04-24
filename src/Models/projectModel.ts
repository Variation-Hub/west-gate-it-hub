import mongoose from "mongoose";
import mailScreenshotModel from "./mailScreenshotModel";
import caseStudy from "./caseStudy";

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
        unique: true,
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
    status: {
        type: String,
        enum: ['InProgress', 'InSolution', 'InReviewWestGate', 'InReview', 'InReviewBidWritingCompany', 'ReSolution', 'UnderSubmission', 'Awarded', 'NotAwarded', 'Submitted'],
        default: 'InProgress',
    },
    sortListUserId: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        required: true
    },
    applyUserId: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        required: true
    },
    clientDocument: {
        type: [mongoose.Schema.Types.Mixed],
        required: true,
        default: []
    },
    westGetDocument: {
        type: [mongoose.Schema.Types.Mixed],
        required: true,
        default: []
    },
    userChatList: {
        type: [mongoose.Schema.Types.ObjectId],
        required: false,
    },
    timeDue: {
        type: Date
    },
    caseStudyRequired: {
        type: Number,
        default: 0
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

projectModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Project', projectModel);