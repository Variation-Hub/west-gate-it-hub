import mongoose from "mongoose";

const CandidateCVSchema = new mongoose.Schema({
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    gender: { type: String },
    nationality: { type: String },
    highestQualification: { type: String },
    yearOfGraduation: { type: Number },
    totalExperience: { type: Number },
    jobTitle: { type: String },
    startDate: { type: Date },
    keyResponsibilities: { type: String },
    previousEmployers: { type: [String] },
    technicalSkills: { type: [String] },
    softSkills: { type: [String] },
    languagesKnown: { type: [String] },
    availableFrom: { type: Date },
    availableTo: { type: Date },
    hourlyRate: { type: Number },
    workingHoursPerWeek: { type: Number },
    overtimeCharges: { type: Number },
    projectsWorkedOn: [{
        projectName: { type: String },
        clientName: { type: String },
        projectDuration: { type: String },
        industryDomain: { type: String },
        projectDescription: { type: String },
        keyResponsibilities: { type: String },
        techStackUsed: { type: [String] },
        teamSize: { type: Number },
        contributionPercentage: { type: Number },
        projectComplexity: { type: String, enum: ['Simple', 'Medium', 'Complex'] },
        outcomeImpact: { type: String },
        clientFeedback: { type: String }
    }]
}, { timestamps: true, versionKey: false, minimize: false });

const CandidateCV = mongoose.model("CandidateCv", CandidateCVSchema);
export default CandidateCV;
