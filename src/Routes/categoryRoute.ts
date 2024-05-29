import * as express from 'express';
import { authorizeRoles } from '../Middleware/verifyToken';
import { createCategory, deleteCategory, getCategoryList, updateCategory } from '../Controllers/categoryController';

const categoryRouter = express.Router();

categoryRouter.get("/list", getCategoryList);
categoryRouter.post("/create", authorizeRoles(), createCategory)
categoryRouter.patch("/update/:id", authorizeRoles(), updateCategory);
categoryRouter.delete("/delete/:id", authorizeRoles(), deleteCategory);

export default categoryRouter;