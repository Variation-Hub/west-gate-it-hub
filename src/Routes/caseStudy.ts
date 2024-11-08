import * as express from 'express';
import { caseStudyList, createCaseStudy, createCaseStudyMultiple, deleteCaseStudy, updateCaseStudy } from '../Controllers/caseStudyController';
import { singleFileUpload } from '../Util/multer';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';

const caseStudyRouter = express.Router();

caseStudyRouter.get("/list", authorizeRoles(), paginationMiddleware, caseStudyList);
caseStudyRouter.post("/create", authorizeRoles(), singleFileUpload("file"), createCaseStudy);
caseStudyRouter.post("/create-multiple", authorizeRoles(), createCaseStudyMultiple);
caseStudyRouter.patch("/update/:id", authorizeRoles(), updateCaseStudy);
caseStudyRouter.delete("/delete/:id", deleteCaseStudy);

export default caseStudyRouter;