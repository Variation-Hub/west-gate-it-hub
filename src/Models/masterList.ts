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
    enum: ["domain", "technologies", "product", "domain-other", "technologies-other", "product-other"]
  },
  isSystem: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
},{ versionKey: false, minimize: false });

export default mongoose.model("masterList", masterListSchema);
