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
        unique: false,
        trim: true,
        default: ""
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
        type: [mongoose.Schema.Types.Mixed],
        default: []
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
            itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'masterList', default: null },
            name: { type: String, default: "" },
            type: { type: String, default: "" },
            subExpertise: { type: [String], default: [] }
        }
    ],
    expertiseICanDo: [
        {
            itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'masterList', default: null },
            name: { type: String, default: "" },
            type: { type: String, default: "" },
            subExpertise: { type: [String], default: [] }
        }
    ],
    pocDetails: [
        {
            name: { type: String, default: "" },
            phone: { type: String, default: "" },
            email: { type: String, default: "" },
            role: { type: String, default: "" },
            isPrimary: { type: Boolean, default: false }
        }
    ],
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
    resourceSharingSupplier: {
        type: Boolean,
        default: false
    },
    subcontractingSupplier: {
        type: Boolean,
        default: false
    },
    // New expertise fields
    cloudPlatforms: {
        type: [String],
        default: [],
    },
    devOpsAutomation: {
        type: [String],
        default: [],
    },
    containerizationOrchestration: {
        type: [String],
        default: [],
    },
    networkingInfrastructure: {
        type: [String],
        default: [],
    },
    securityIAM: {
        type: [String],
        default: [],
    },
    monitoringObservability: {
        type: [String],
        default: [],
    },
    integrationAPIManagement: {
        type: [String],
        default: [],
    },
    eventStreamingMessaging: {
        type: [String],
        default: [],
    },
    aiMLPlatforms: {
        type: [String],
        default: [],
    },
    databasePlatforms: {
        type: [String],
        default: [],
    },
    dataAnalyticsBI: {
        type: [String],
        default: [],
    },
    erpEnterpriseSystems: {
        type: [String],
        default: [],
    },
    crmCustomerPlatforms: {
        type: [String],
        default: [],
    },
    itsmITOperations: {
        type: [String],
        default: [],
    },
    businessAppsProductivity: {
        type: [String],
        default: [],
    },
    eCommerceCMS: {
        type: [String],
        default: [],
    },
    learningHRSystems: {
        type: [String],
        default: [],
    },
    lowCodeNoCodePlatforms: {
        type: [String],
        default: [],
    },
    testingQA: {
        type: [String],
        default: [],
    },
    web3DecentralizedTech: {
        type: [String],
        default: [],
    },
    services: {
        type: [String],
        default: [],
    },
    product: {
        type: [String],
        default: [],
    },
    isInHold: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    inHoldComment: [{
        comment: {
            type: String,
            default: ""
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    executiveSummary: {
        type: String,
        default: '',
    },
    turnover: {
        type: Number,
        default: 0,
    },
    totalProjectsExecuted: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isPOCUserUpdate: {
        type: Boolean,
        default: false
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

// Performance Indexes
userModel.index({ role: 1 });
userModel.index({ active: 1 });
userModel.index({ email: 1 });
userModel.index({ role: 1, active: 1 });
userModel.index({ createdAt: 1 });
userModel.index({ updatedAt: 1 }); 
userModel.index({ name: "text", companyName: "text" });

export default mongoose.model('User', userModel);