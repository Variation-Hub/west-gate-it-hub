import * as express from 'express';
import userRoutes from './userRoute';
import projectRoutes from './projectRoute';
import foiRoutes from './foiRoute';
import mailScreenShotModeRoutes from './mailScreenshotModeRoute';
import caseStudyRouter from './caseStudy';
import summaryQuestionRouter from './summaryQuestion';
import chatRouter from './chatRoute';

const Routes = express.Router();

Routes.use("/user", userRoutes);
Routes.use("/project", projectRoutes);
Routes.use("/foi", foiRoutes);
Routes.use("/mail-screenshot", mailScreenShotModeRoutes);
Routes.use("/case-study", caseStudyRouter);
Routes.use("/summary-question", summaryQuestionRouter);
Routes.use("/chat", chatRouter);

export default Routes; 
