import mongoose from "mongoose";

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
    instructions: {
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
    deadline: {
        type: Date,
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
        type: [mongoose.Schema.Types.Mixed], // {type : string , message: string, date: Date}
        required: true,
        default: [],
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
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