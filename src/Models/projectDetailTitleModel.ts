import mongoose from "mongoose";

const ProjectDetailTitleModel = new mongoose.Schema({
    text: {
        type: String,
        trim: true,
        default: null
    },
    images: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    roles: {
        type: [String],
        default: []
    },
    description: {
        type: String,
        trim: true,
        default: null
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    type: {
        type: String,
        enum: ['Text', 'Image'],
        default: 'Text',
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

ProjectDetailTitleModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('ProjectDetailTitle', ProjectDetailTitleModel);