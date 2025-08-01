import mongoose from "mongoose";
import { taskCategory, taskStatus, taskType } from "../Util/contant";

const SubTaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: taskStatus,
        default: taskStatus.Ongoing,
    },
    dueDate: {
        type: Date,
        default: null,
    },
    resources: [
        {
            _id: false,
            candidateId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            assignedAt: {
                type: Date,
                default: Date.now,
            },
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
}, { versionKey: false, minimize: false });

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
    },
    subtasks: [SubTaskSchema],
}, { versionKey: false, minimize: false });

TaskModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

// Performance Indexes for optimal query performance
TaskModel.index({ "assignTo.userId": 1 });
TaskModel.index({ status: 1 });
TaskModel.index({ project: 1 });
TaskModel.index({ dueDate: 1 });
TaskModel.index({ pickACategory: 1 });
TaskModel.index({ type: 1 });
TaskModel.index({ myDay: 1 });
TaskModel.index({ createdAt: 1 });
TaskModel.index({ updatedAt: 1 });
TaskModel.index({ "assignTo.userId": 1, status: 1 });
TaskModel.index({ project: 1, "assignTo.userId": 1 });
TaskModel.index({ dueDate: 1, status: 1 });
TaskModel.index({ task: "text" });
TaskModel.index({ "subtasks.resources.candidateId": 1 });
TaskModel.index({ "comments.userId": 1 });
TaskModel.index({ "assignTo.userId": 1, createdAt: -1 });
TaskModel.index({ "comments.date": 1 });
TaskModel.index({ "assignTo.userId": 1, "comments.date": 1 });

export default mongoose.model('Task', TaskModel);