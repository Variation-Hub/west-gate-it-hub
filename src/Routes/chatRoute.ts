import * as express from 'express';
import { multipleFileUpload } from '../Util/multer';
import { authorizeRoles } from '../Middleware/verifyToken';
import { paginationMiddleware } from '../Middleware/pagination';
import { addUserToChat, chatList, createChat, deleteChat, getUserChatGroup } from '../Controllers/chatController';

const chatRouter = express.Router();

chatRouter.get("/list", authorizeRoles(), paginationMiddleware, chatList);
chatRouter.post("/create", authorizeRoles(), multipleFileUpload("files", 5), createChat);
chatRouter.delete("/delete/:id", authorizeRoles(), deleteChat);
chatRouter.patch("/add", authorizeRoles(), addUserToChat);
chatRouter.get("/list/chat-group/:id", authorizeRoles(), getUserChatGroup);

export default chatRouter;