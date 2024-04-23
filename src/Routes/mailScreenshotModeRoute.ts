import * as express from 'express';
import { singleFileUpload } from '../Util/multer';
import { createScreenShot, deleteScreenShot, getScreenShots, updateScreenShot } from '../Controllers/mailScreenshotModeController';
import { paginationMiddleware } from '../Middleware/pagination';

const mailScreenShotModeRoutes = express.Router();

mailScreenShotModeRoutes.post("/create", singleFileUpload("link"), createScreenShot);
mailScreenShotModeRoutes.get("/list", paginationMiddleware, getScreenShots);
mailScreenShotModeRoutes.patch("/update/:id", singleFileUpload("link"), updateScreenShot);
mailScreenShotModeRoutes.delete("/delete/:id", deleteScreenShot);

export default mailScreenShotModeRoutes;