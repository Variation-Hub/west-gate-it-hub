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
    enum: [
      "Product",
      "Service",
      "Testing Tools",
      "Cloud Platforms",
      "DevOps & Automation",
      "Containerization & Orchestration",
      "Networking & Infrastructure",
      "Database Platforms",
      "Data, Analytics & BI",
      "AI/ML Platforms",
      "Security & IAM",
      "Monitoring & Observability",
      "Integration & API Management",
      "Event Streaming & Messaging",
      "ERP/Enterprise Systems",
      "CRM & Customer Platforms",
      "ITSM/IT Operations",
      "Business Apps & Productivity",
      "E-Commerce & CMS",
      "Learning & HR Systems",
      "Low-Code/No-Code Platforms",
      "Testing & QA",
      "Web3 & Decentralized Tech"
    ]
  },
  isSystem: {
    type: Boolean,
    default: true
  },
  subExpertise: [{ type: String }],
  tags: {
    type: [String],
    default: [],
    trim: true
  },
  isMandatory: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
},{ versionKey: false, minimize: false });

export default mongoose.model("masterList", masterListSchema);
