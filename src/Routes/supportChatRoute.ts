import * as express from "express";
import { authorizeRoles } from "../Controllers/Middleware/verifyToken";
import {
  startSupportChat,
  sendSupportMessage,
  getSupportChatHistory,
  getActiveSupportChats,
  closeSupportChat,
} from "../Controllers/supportChatController";

const supportChatRouter = express.Router();

// Public routes (no authentication required)
supportChatRouter.post("/start", startSupportChat);
supportChatRouter.post("/send", sendSupportMessage);
supportChatRouter.get("/history", getSupportChatHistory);

// Admin only routes
supportChatRouter.get("/admin/active", getActiveSupportChats);
supportChatRouter.put("/admin/close/:sessionId", closeSupportChat);

export default supportChatRouter;
