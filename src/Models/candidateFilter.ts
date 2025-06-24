import mongoose from "mongoose";

const CandidateFilterSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null },
    anonymousUserId: { type: String, required: false, default: null },
    jobTitle: { type: String, required: true },
    minExperience: { type: Number, default: 0 },
    maxExperience: { type: Number, default: 999 },
    active: { type: Boolean, default: true },
    candidateCount: { type: Number, default: 0 }
}, { timestamps: true, versionKey: false });

const CandidateFilter = mongoose.model("CandidateFilter", CandidateFilterSchema);
export default CandidateFilter;
