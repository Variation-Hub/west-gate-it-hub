import mongoose from "mongoose";
import { taskCategory, taskStatus, taskType } from "../Util/contant";

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
        default: [],
        validate: {
            validator: function (value: any): boolean {
                return value !== null;
            },
            message: 'assignTo cannot be null.',
        },
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null,
    },
    status: {
        type: String,
        enum: taskStatus,
        required: true,
        default: taskStatus.Ongoing
    },
    type: {
        type: String,
        enum: taskType,
        required: true,
        default: taskType.Other
    },
    pickACategory: {
        type: String,
        enum: taskCategory,
        default: taskCategory.none
    },
    myDay: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
    },
    completedTask: {
        type: Boolean,
        default: false
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