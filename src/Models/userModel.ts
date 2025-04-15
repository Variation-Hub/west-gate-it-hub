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
    },
    companyName: {
        type: String,
        default: ""
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
        // unique: true,
        // required: true
        default: ""
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
    lastLogin: {
        type: Date,
        default: null
    },
    active: {
        type: Boolean,
        default: true
    },
    activeStatus: {
        type: String,
        default: ""
    },
    // designation: {
    //     type: String,
    //     default: ""
    // },
    // number: {
    //     type: String,
    //     default: ""
    // },
    // password: {
    //     type: String,
    //     required: true,
    //     minlength: 6
    // },
    // companyName: {
    //     type: String,
    //     default: ""
    // },
    registerNumber: {
        type: String,
        default: ""
    },
    website: {
        type: String,
        default: ""
    },
    numberOfEmployees: {
        type: Number,
        default: ""
    },
    numberOfBranch: {
        type: Number,
        default: ""
    },
    mainOfficeAddress: {
        type: String,
        default: ""
    },
    companyContactNumber: {
        type: Number,
        default: ""
    },
    sector: {
        type: [String],
        default: []
    },
    // plan: {
    //     type: String,
    //     default: "Basic"
    // },
    registerCompany: {
        type: Boolean,
        default: false
    },
    companyActive: {
        type: Boolean,
        default: false
    },
    howLongCompanyBussiness: {
        type: Number,
        default: 1
    },
    caseStudeyPrevious: {
        type: Boolean,
        default: false
    },
    nominateAccount: {
        type: Boolean,
        default: false
    },
    supportNewBusiness: {
        type: Boolean,
        default: false
    },
    accountManagerName: {
        type: String,
        default: ""
    },
    accountManagerEmail: {
        type: String,
        default: ""
    },
    accountManagerDesignation: {
        type: String,
        default: ""
    },
    activeSince: {
        type: String,
        default: ""
    },
    accountManagerNumber: {
        type: String,
        default: ""
    },
    yearOfEstablishment: {
        type: Date,
        default: null
    },
    typeOfCompany: {
        type: [String],
        default: [],
    },
    industry_Sector: {
        type: [String],
        default: [],
    },
    companyAddress: {
        type: String,
        default: ""
    },
    customerSupportContact: {
        type: String,
        default: ""
    },
    legalAndRegulatoryInformation: {
        type: String,
        default: ""
    },
    VATOrGSTNumber: {
        type: String,
        default: ""
    },
    companyDirectors_Owners: {
        type: String,
        default: ""
    },
    complianceCertifications: {
        type: String,
        default: ""
    },
    products_ServicesOffered: {
        type: String,
        default: ""
    },
    technologyStack: {
        type: [String],
        default: [],
    },
    licensingDetails: {
        type: String,
        default: ""
    },
    IP_Patents: {
        type: String,
        default: ""
    },
    employeeCount: {
        type: Number,
        default: ""
    },
    developerOrEngineerTeams: {
        type: String,
        default: ""
    },
    dataPrivacyPolicies: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    securityCertifications: {
        type: String,
        default: ""
    },
    cybersecurityPractices: {
        type: String,
        default: ""
    },
    expertise: [
        {
          itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'masterList', required: true },
          name: { type: String, required: true },
          type: { type: String, required: true }, 
          subExpertise: [{ type: String }]
        }
    ],
    poc_name: { type: String, default: "" },
    poc_phone: { type: String, default: "" },
    poc_email: { type: String, default: "" },
    poc_role: { type: String, default: "" },
    certifications: { 
        type: [String],
        default: [],
     },
    logo: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    country: {
        type: String,
        default: "",
    },
    keyClients: {
        type: [String],
        default: [],
    },
    inactiveDate: { type: Date },
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