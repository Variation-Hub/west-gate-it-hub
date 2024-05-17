import * as express from 'express';
import { authorizeRoles } from '../Middleware/verifyToken';
import { createIndustry, deleteIndustry, getIndustryList, updateIndustry } from '../Controllers/industryController';

const industryRouter = express.Router();

industryRouter.get("/list", authorizeRoles(), getIndustryList);
industryRouter.post("/create", authorizeRoles(), createIndustry)
industryRouter.patch("/update/:id", authorizeRoles(), updateIndustry);
industryRouter.delete("/delete/:id", authorizeRoles(), deleteIndustry);

export default industryRouter;