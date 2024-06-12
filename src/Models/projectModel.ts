import mongoose from "mongoose";
import { projectStatus } from "../Util/contant";

const projectModel = new mongoose.Schema({
    projectName: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        trim: true,
    },
    industry: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    BOSID: {
        type: String,
        trim: true,
        unique: true,
    },
    publishDate: {
        type: Date,
        default: Date.now,
    },
    submission: {
        type: Date,
    },
    link: {
        type: String,
        trim: true,
    },
    periodOfContractStart: {
        type: Date,
    },
    periodOfContractEnd: {
        type: Date,
    },
    dueDate: {
        type: Date,
    },
    projectType: {
        type: String,
        trim: true,
    },
    website: {
        type: String,
        trim: true,
    },
    mailID: {
        type: String,
        trim: true,
    },
    clientType: {
        type: String,
        trim: true,
    },
    clientName: {
        type: String,
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
    },
    applyUserId: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
    },
    clientDocument: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    westGetDocument: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    userChatList: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
    },
    timeDue: {
        type: Date
    },
    bidsubmissiontime: {
        type: String,
        default: ""
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
    noticeReference: {
        type: String
    },
    CPVCodes: {
        type: String
    },
    minValue: {
        type: String
    },
    maxValue: {
        type: String
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