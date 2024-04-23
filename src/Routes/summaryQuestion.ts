import * as express from 'express';
import { createSummaryQuestion, deleteSummaryQuestion, summaryQuestionList, updateSummaryQuestion } from '../Controllers/summaryQuestionController';

const summaryQuestionRouter = express.Router();

summaryQuestionRouter.get("/list", summaryQuestionList);
summaryQuestionRouter.post("/create", createSummaryQuestion);
summaryQuestionRouter.patch("/update/:id", updateSummaryQuestion);
summaryQuestionRouter.delete("/delete/:id", deleteSummaryQuestion);

export default summaryQuestionRouter;