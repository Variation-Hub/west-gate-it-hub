import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['main', 'sub'],
        default: 'main'
    },
    parentRoleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        default: null
    },
    // Keep for backward compatibility during transition
    otherRoles: [
        { type: String }
    ],
    relatedRoles: [
        { type: String }
    ],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true, versionKey: false, minimize: false, strict: false });

const Role = mongoose.model("Role", RoleSchema);
export default Role;
