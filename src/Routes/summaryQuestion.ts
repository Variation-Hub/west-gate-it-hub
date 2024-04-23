import * as express from 'express';
import { addReviewQuestion, createSummaryQuestion, deleteSummaryQuestion, summaryQuestionList, updateSummaryQuestion } from '../Controllers/summaryQuestionController';

const summaryQuestionRouter = express.Router();

summaryQuestionRouter.get("/list", summaryQuestionList);
summaryQuestionRouter.post("/create", createSummaryQuestion);
summaryQuestionRouter.patch("/update/:id", updateSummaryQuestion);
summaryQuestionRouter.delete("/delete/:id", deleteSummaryQuestion);
summaryQuestionRouter.patch("/add-review/:id", addReviewQuestion);

export default summaryQuestionRouter;