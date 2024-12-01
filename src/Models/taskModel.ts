import mongoose from "mongoose";
import { taskStatus } from "../Util/contant";

const TaskModel = new mongoose.Schema({
    task: {
        type: String,
        required: true,
        trim: true,
    },
    subTask: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    dueDate: {
        type: Date,
        required: true,
    },
    assignDate: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    assignTo: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    status: {
        type: String,
        enum: taskStatus,
        required: true,
        default: taskStatus.Todo
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