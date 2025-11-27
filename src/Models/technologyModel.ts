import mongoose from "mongoose";

const technologySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  isSystem: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { versionKey: false, minimize: false });

export default mongoose.model("Technology", technologySchema);
