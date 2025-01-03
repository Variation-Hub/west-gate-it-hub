import mongoose from "mongoose";

const ProjectDetailTitleModel = new mongoose.Schema({
    text: {
        type: String,
        trim: true,
        default: null
    },
    imageText: {
        type: String,
        trim: true,
        default: null
    },
    image: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    userIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    discription: {
        type: String,
        trim: true,
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