import mongoose from "mongoose";
import { BidManagerStatus, projectStatus, projectStatus1 } from "../Util/contant";

function getCurrentISTTime() {
    const currentDate = new Date();
    const utcOffset = currentDate.getTime() + (currentDate.getTimezoneOffset() * 60000);
    const istOffset = 5.5 * 3600000;

    return new Date(utcOffset + istOffset);
}

const projectModel = new mongoose.Schema({
    projectName: {
        type: String,
        trim: true,
        default: ""
    },
    category: {
        type: [String],
        default: []
    },
    industry: {
        type: [String],
        default: []
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    BOSID: {
        type: String,
        trim: true,
        unique: true,
        default: ""
    },
    publishDate: {
        type: Date,
        default: getCurrentISTTime
    },
    submission: {
        type: Date,
        default: null
    },
    link: {
        type: String,
        trim: true,
        default: ""
    },
    periodOfContractStart: {
        type: Date,
        default: null
    },
    periodOfContractEnd: {
        type: Date,
        default: null
    },
    dueDate: {
        type: Date,
        default: null
    },
    value: {
        type: Number,
        trim: true,
        default: null
    },
    projectType: {
        type: String,
        trim: true,
        default: ""
    },
    website: {
        type: String,
        trim: true,
        default: ""
    },
    mailID: {
        type: String,
        trim: true,
        default: ""
    },
    clientType: {
        type: String,
        trim: true,
        default: ""
    },
    clientName: {
        type: String,
        trim: true,
        default: ""
    },
    status: {
        type: String,
        // enum: projectStatus,
        trim: true,
        default: projectStatus.Awaiting,
    },
    statusHistory: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    bidManagerStatus: {
        type: String,
        // enum: projectStatus,
        trim: true,
        default: ""
        // default: projectStatus1.InSolution,
    },
    bidManagerStatusComment: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    BidWritingStatus: {
        type: String,
        // enum: projectStatus,
        trim: true,
        //default: BidWritingStatus.UKExpertReview,
    },
    statusComment: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    comment: {
        type: String,
        default: ""
    },
    projectComment: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    failStatusImage: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    failStatusReason: {
        type: [mongoose.Schema.Types.Mixed],
        // enum: ['Accreditation', 'Experience', 'Financial Condition', 'Not Related', 'Pre-Market', 'Product', 'Service', 'Subcontracting-NO', 'Time Constraints'],
        default: []
    },
    sortListUserId: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
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
        type: Date,
        default: null
    },
    bidsubmissiontime: {
        type: String,
        default: ""
    },
    bidsubmissionhour: {
        type: String,
        default: "00"
    },
    bidsubmissionminute: {
        type: String,
        default: "00"
    },
    caseStudyRequired: {
        type: Number,
        default: 0
    },
    subContracting: {
        type: Boolean,
        default: false
    },
    subContractingfile: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    economicalPartnershipQueryFile: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    economicalPartnershipResponceFile: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    FeasibilityOtherDocuments: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    loginDetail: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    eligibilityForm: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    // certifications: {
    //     type: [String],
    //     default: []
    // },
    // policy: {
    //     type: [String],
    //     default: []
    // },
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
        type: Date,
        default: null
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
        type: String,
        default: ""
    },
    CPVCodes: {
        type: String,
        default: ""
    },
    minValue: {
        type: Number,
        default: 0
    },
    maxValue: {
        type: Number,
        default: 0
    },
    waitingForResult: {
        type: Boolean,
        default: false
    },
    appointedUserId: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
    },
    appointedBidManager: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
    },
    expiredData: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    logs: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    feasibilityStatus: {
        type: String,
        enum: ['feasibility status change', 'approve', 'reject'],
    },
    adminStatus: {
        type: String,
        enum: ['feasibility status change', 'bid manager status change'],
    },
    myList: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    categorisation: {
        type: String,
        enum: ['DPS/Framework', 'DTD', ''],
        default: ''
    },
    createdAt: {
        type: Date,
        default: getCurrentISTTime
    },
    updatedAt: {
        type: Date,
        default: getCurrentISTTime
    }
}, { versionKey: false, minimize: false });

projectModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Project', projectModel);