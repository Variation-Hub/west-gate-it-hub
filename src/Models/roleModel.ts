import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
}, { timestamps: true, versionKey: false, minimize: false });

const Role = mongoose.model("Role", RoleSchema);
export default Role;
