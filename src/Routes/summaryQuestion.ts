import * as express from 'express';
import { addReviewQuestion, createSummaryQuestion, deleteSummaryQuestion, summaryQuestionList, summaryQuestionListByUser, updateSummaryQuestion } from '../Controllers/summaryQuestionController';
import { authorizeRoles } from '../Middleware/verifyToken';

const summaryQuestionRouter = express.Router();

summaryQuestionRouter.get("/list", authorizeRoles(), summaryQuestionList);
summaryQuestionRouter.get("/list/:userId", authorizeRoles(), summaryQuestionListByUser);
summaryQuestionRouter.post("/create", authorizeRoles(), createSummaryQuestion);
summaryQuestionRouter.patch("/update/:id", authorizeRoles(), updateSummaryQuestion);
summaryQuestionRouter.delete("/delete/:id", authorizeRoles(), deleteSummaryQuestion);
summaryQuestionRouter.patch("/add-review/:id", authorizeRoles(), addReviewQuestion);

export default summaryQuestionRouter;