import mongoose from "mongoose";
import { summaryQuestionFor, summaryQuestionType } from "../Util/contant";

const QuestionModel = new mongoose.Schema({
    questionName: {
        type: String,
        required: true,
        trim: true,
    },
    question: {
        type: String,
        required: true,
        trim: true,
    },
    refrenceDocument: {
        type: String,
        required: true,
        trim: true,
    },
    weightage: {
        type: Number,
        required: true,
    },
    verify: {
        type: Boolean,
        required: true,
        default: false,
    },
    comment: {
        type: String,
        required: false,
    },
    response: {
        type: [mongoose.Schema.Types.Mixed], // {type : string , message: string, date: Date} type enum : ["reply","review"]
        required: true,
        default: [],
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
    },
    summaryQuestionFor: {
        type: String,
        enum: summaryQuestionFor,
        required: true,
    },
    assignTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    sampleFile: {
        type: mongoose.Schema.Types.Mixed
    },
    responseFile: {
        type: mongoose.Schema.Types.Mixed
    },
    type: {
        type: String,
        enum: summaryQuestionType,
        default: summaryQuestionType.Text
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

QuestionModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('SummaryQuestion', QuestionModel);