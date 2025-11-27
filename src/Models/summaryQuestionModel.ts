import mongoose from "mongoose";
import { summaryQuestionFor, summaryQuestionType } from "../Util/contant";

const QuestionModel = new mongoose.Schema({
    questionName: {
        type: String,
        trim: true,
    },
    question: {
        type: String,
        trim: true,
    },
    refrenceDocument: {
        type: String,
        trim: true,
    },
    weightage: {
        type: String,
    },
    instructions: {
        type: String,
    },
    verify: {
        type: Boolean,
        default: false,
    },
    comment: {
        type: String,
    },
    response: {
        type: [mongoose.Schema.Types.Mixed], // {type : string , message: string, date: Date} type enum : ["reply","review"]
        default: [],
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    summaryQuestionFor: {
        type: String,
        enum: summaryQuestionFor,
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
}, { versionKey: false, minimize: false });

QuestionModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('SummaryQuestion', QuestionModel);