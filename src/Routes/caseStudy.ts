import * as express from 'express';
import { caseStudyList, createCaseStudy, deleteCaseStudy, updateCaseStudy } from '../Controllers/caseStudyController';
import { singleFileUpload } from '../Util/multer';
import { authorizeRoles } from '../Middleware/verifyToken';
import { paginationMiddleware } from '../Middleware/pagination';

const caseStudyRouter = express.Router();

caseStudyRouter.get("/list", authorizeRoles, paginationMiddleware, caseStudyList);
caseStudyRouter.post("/create", authorizeRoles, singleFileUpload("file"), createCaseStudy);
caseStudyRouter.patch("/update/:id", authorizeRoles, updateCaseStudy);
caseStudyRouter.delete("/delete/:id", deleteCaseStudy);

export default caseStudyRouter;