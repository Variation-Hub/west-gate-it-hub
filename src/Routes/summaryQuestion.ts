import * as express from 'express';
import { addReviewQuestion, createSummaryQuestion, deleteSummaryQuestion, summaryQuestionList, summaryQuestionListByUser, updateSummaryQuestion, uploadSummaryQuestionDocument } from '../Controllers/summaryQuestionController';
import { authorizeRoles } from '../Middleware/verifyToken';
import { userRoles } from '../Util/contant';
import { singleFileUpload } from '../Util/multer';

const summaryQuestionRouter = express.Router();

summaryQuestionRouter.get("/list", authorizeRoles(), summaryQuestionList);
summaryQuestionRouter.get("/list/:userId", authorizeRoles(), summaryQuestionListByUser);
summaryQuestionRouter.post("/create", authorizeRoles(), createSummaryQuestion);
summaryQuestionRouter.patch("/update/:id", authorizeRoles(), updateSummaryQuestion);
summaryQuestionRouter.delete("/delete/:id", authorizeRoles(), deleteSummaryQuestion);
summaryQuestionRouter.patch("/add-review/:id", authorizeRoles(), addReviewQuestion);

//UKWriter Routes
summaryQuestionRouter.patch("/uk-writer/update/:id", authorizeRoles(userRoles.UKWriter, userRoles.Admin), singleFileUpload("document"), uploadSummaryQuestionDocument);

export default summaryQuestionRouter;