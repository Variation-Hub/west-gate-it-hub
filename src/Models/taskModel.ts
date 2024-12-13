import mongoose from "mongoose";
import { taskCategory, taskStatus } from "../Util/contant";

const TaskModel = new mongoose.Schema({
    task: {
        type: String,
        required: true,
        trim: true,
    },
    discription: {
        type: String,
        default: "",
    },
    comments: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
    },
    dueDate: {
        type: Date,
        // required: true,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    assignTo: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
    status: {
        type: String,
        enum: taskStatus,
        required: true,
        default: taskStatus.Todo
    },
    pickACategory: {
        type: String,
        enum: taskCategory,
        default: taskCategory.none
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

TaskModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Task', TaskModel);