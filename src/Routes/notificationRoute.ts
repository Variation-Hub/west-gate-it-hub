import * as express from 'express';
import { multipleFileUpload } from '../Util/multer';
import { authorizeRoles } from '../Middleware/verifyToken';
import { addUserToChat, chatList, createChat, deleteChat, getUserChatGroup } from '../Controllers/chatController';
import { createNotification, deleteNotification, deleteNotifications, getNotifications, markreadNotification, markreadNotifications } from '../Controllers/notificationController';

const notificationRouter = express.Router();

notificationRouter.post("/create", authorizeRoles(), createNotification);
notificationRouter.get("/list", authorizeRoles(), getNotifications);
notificationRouter.delete("/delete/:id", authorizeRoles(), deleteNotification);
notificationRouter.delete("/delete", authorizeRoles(), deleteNotifications);
notificationRouter.patch("/mart-read/:id", authorizeRoles(), markreadNotification);
notificationRouter.patch("/mart-read", authorizeRoles(), markreadNotifications);

export default notificationRouter;