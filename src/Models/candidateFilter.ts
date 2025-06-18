import mongoose from "mongoose";

const CandidateFilterSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobTitle: { type: String, required: true },
    minExperience: { type: Number },
    maxExperience: { type: Number },
    active: { type: Boolean, default: true },
    candidateCount: { type: Number, default: 0 }
}, { timestamps: true, versionKey: false });

const CandidateFilter = mongoose.model("CandidateFilter", CandidateFilterSchema);
export default CandidateFilter;
