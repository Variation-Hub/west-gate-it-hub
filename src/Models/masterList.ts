import mongoose from "mongoose";

const masterListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ["expertise", "domain", "technology", "other"]
  },
  isSystem: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("masterList", masterListSchema);
