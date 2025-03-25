import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
    otherRole: [
        { type: String }
    ] 
}, { timestamps: true, versionKey: false, minimize: false });

const Role = mongoose.model("Role", RoleSchema);
export default Role;
