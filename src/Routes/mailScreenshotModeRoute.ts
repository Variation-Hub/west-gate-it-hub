import * as express from 'express';
import { singleFileUpload } from '../Util/multer';
import { createScreenShot, deleteScreenShot, getScreenShots, updateScreenShot } from '../Controllers/mailScreenshotModeController';
import { paginationMiddleware } from '../Middleware/pagination';
import { userRoles } from '../Util/contant';
import { authorizeRoles } from '../Middleware/verifyToken';

const mailScreenShotModeRoutes = express.Router();

mailScreenShotModeRoutes.post("/create", authorizeRoles(userRoles.BOS, userRoles.Admin), singleFileUpload("link"), createScreenShot);
mailScreenShotModeRoutes.get("/list", authorizeRoles(userRoles.BOS, userRoles.Admin), paginationMiddleware, getScreenShots);
mailScreenShotModeRoutes.patch("/update/:id", authorizeRoles(userRoles.BOS, userRoles.Admin), singleFileUpload("link"), updateScreenShot);
mailScreenShotModeRoutes.delete("/delete/:id", authorizeRoles(userRoles.BOS, userRoles.Admin), deleteScreenShot);

export default mailScreenShotModeRoutes;