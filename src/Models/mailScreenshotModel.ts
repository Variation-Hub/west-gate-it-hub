import mongoose from "mongoose";

const mailScreenShotModel = new mongoose.Schema({
    projectName: {
        type: String,
        required: true,
        trim: true,
    },
    BOSId: {
        type: String,
        required: true,
        trim: true
    },
    emailId: {
        type: String,
        required: true,
        trim: true
    },
    link: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
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

mailScreenShotModel.pre('save', async function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('MailScreenShot', mailScreenShotModel);
