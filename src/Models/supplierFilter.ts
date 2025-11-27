import mongoose from "mongoose";

const SupplierFilterSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null },
    anonymousUserId: { type: String, required: false, default: null },
    projectName: { type: String, required: false },
    expertise: { type: String, required: false },
    tags: { type: String, required: false },
    active: { type: Boolean, default: true },
    supplierCount: { type: Number, default: 0 }
}, { timestamps: true, versionKey: false });

const SupplierFilter = mongoose.model("SupplierFilter", SupplierFilterSchema);
export default SupplierFilter;
