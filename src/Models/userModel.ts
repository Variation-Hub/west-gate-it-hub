import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { userRoles, userStatus } from "../Util/contant";

interface UserDocument extends Document {
    password: string;
    updatedAt?: Date;
    email?: string;
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
        enum: userRoles,
        required: true,
        default: 'User'
    },
    mobileNumber: {
        type: String,
        trim: true,
        unique: true,
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
        type: [String],
        default: []
    },
    userName: {
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    domain: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        trim: true
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    location: {
        type: String,
        default: "",
        trim: "",
    },
    reportTo: {
        type: String,
        default: "",
    },
    manages: {
        type: [String],
        default: [],
    },
    plan: {
        type: String,
        enum: ["Basic", "Silver", "Gold", "Premium"],
        default: "Basic"
    },
    status: {
        type: String,
        enum: userStatus,
        required: true,
        default: 'Active'
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

userModel.pre('save', async function (this: UserDocument, next) {
    this.updatedAt = new Date();

    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);

        this.email = this.email?.toLowerCase();
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

            this.email = this.email?.toLowerCase();

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