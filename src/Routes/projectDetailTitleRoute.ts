import * as express from 'express';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';
import { createProjectDetailsTitle, deleteProjectDetailsTitle, getProjectDetailsTitles } from '../Controllers/projectDetailTitleController';
import { singleFileUpload } from '../Util/multer';

const projectDetailTitleRouter = express.Router();

projectDetailTitleRouter.get("/list", authorizeRoles(), paginationMiddleware, getProjectDetailsTitles);
projectDetailTitleRouter.post("/create", authorizeRoles(), singleFileUpload("image"), createProjectDetailsTitle)
projectDetailTitleRouter.delete("/delete/:id", authorizeRoles(), deleteProjectDetailsTitle);

export default projectDetailTitleRouter;