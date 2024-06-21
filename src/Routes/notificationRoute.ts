import * as express from 'express';
import { authorizeRoles } from '../Middleware/verifyToken';
import { createNotification, deleteNotification, deleteNotifications, getNotifications, getNotificationsCount, markreadNotification, markreadNotifications } from '../Controllers/notificationController';

const notificationRouter = express.Router();

notificationRouter.post("/create", authorizeRoles(), createNotification);
notificationRouter.get("/list", authorizeRoles(), getNotifications);
notificationRouter.get("/count", authorizeRoles(), getNotificationsCount);
notificationRouter.delete("/delete/:id", authorizeRoles(), deleteNotification);
notificationRouter.delete("/delete", authorizeRoles(), deleteNotifications);
notificationRouter.patch("/mart-read/:id", authorizeRoles(), markreadNotification);
notificationRouter.patch("/mart-read", authorizeRoles(), markreadNotifications);

export default notificationRouter;