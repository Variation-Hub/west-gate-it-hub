import mongoose from "mongoose";
import { projectStatus } from "../Util/contant";

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
        enum: projectStatus,
        default: projectStatus.Awaiting,
    },
    statusComment: {
        type: String,
    },
    failStatusImage: {
        type: mongoose.Schema.Types.Mixed
    },
    failStatusReason: {
        type: [String],
        enum: ['Accreditation', 'Experience', 'Financial Condition', 'Not Related', 'Pre-Market', 'Product', 'Service', 'Subcontracting-NO', 'Time Constraints']
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
        default: []
    },
    timeDue: {
        type: Date
    },
    caseStudyRequired: {
        type: Number,
        default: 0
    },
    subContracting: {
        type: Boolean,
    },
    subContractingfile: {
        type: mongoose.Schema.Types.Mixed
    },
    economicalPartnershipQueryFile: {
        type: mongoose.Schema.Types.Mixed
    },
    economicalPartnershipResponceFile: {
        type: mongoose.Schema.Types.Mixed
    },
    FeasibilityOtherDocuments: {
        type: mongoose.Schema.Types.Mixed
    },
    loginDetail: {
        type: [mongoose.Schema.Types.Mixed]
    },
    certifications: {
        type: String
    },
    policy: {
        type: String,
    },
    select: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    finalizedId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    finalizedById: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    closedDate: {
        type: Date
    },
    dropUser: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    supportingDocs: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    stages: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
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