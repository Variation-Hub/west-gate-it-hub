import * as express from 'express';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { createIndustry, deleteIndustry, getIndustryList, updateIndustry } from '../Controllers/industryController';

const industryRouter = express.Router();

industryRouter.get("/list", getIndustryList);
industryRouter.post("/create", authorizeRoles(), createIndustry)
industryRouter.patch("/update/:id", authorizeRoles(), updateIndustry);
industryRouter.delete("/delete/:id", authorizeRoles(), deleteIndustry);

export default industryRouter;