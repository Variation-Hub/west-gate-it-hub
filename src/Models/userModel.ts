import mongoose from "mongoose";
import bcrypt from "bcrypt";

interface UserDocument extends Document {
    password: string;
    updatedAt?: Date;
    isModified: any;
}

const userModel = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['BOS', 'SupplierAdmin', 'SupplierUser'],
        required: true
    },
    companyName: {
        type: String,
    },
    designation: {
        type: String,
    },
    doj: {
        type: Date,
        default: Date.now
    },
    linkedInLink: {
        type: String,
    },
    cv: {
        type: mongoose.Schema.Types.Mixed,
    },
    avatar: {
        type: mongoose.Schema.Types.Mixed,
    },
    categoryList: {
        type: [String]
    },
    userName:{
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    domain: {
        type: String,
        trim:true
    },
    department: {
        type: String,
        trim: true
    },
    supplierId:{
        type: mongoose.Schema.Types.ObjectId,
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

userModel.pre('save', async function (this: UserDocument, next) {
    this.updatedAt = new Date();

    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
        next();
    } catch (error: any) {
        next(error);
    }
});

userModel.pre('findOneAndUpdate', async function (this: any, next) {
    const update = this.getUpdate();

    if (update.password) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(update.password, salt);
            this.setUpdate({ ...update, password: hashedPassword });
            next();
        } catch (error: any) {
            next(error);
        }
    } else {
        this.setUpdate({ ...update, updatedAt: new Date() });
        next();
    }
});

export default mongoose.model('User', userModel);