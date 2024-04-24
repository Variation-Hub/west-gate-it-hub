import * as express from 'express';
import { applyProject, createProject, deleteProject, getDashboardDataSupplierAdmin, getProject, getProjects, sortList, updateProject } from '../Controllers/projectController';
import { paginationMiddleware } from '../Middleware/pagination';
import { authorizeRoles } from '../Middleware/verifyToken';
import { userRoles } from '../Util/contant';

const projectRoutes = express.Router();

projectRoutes.post("/create", createProject);
projectRoutes.get("/list", authorizeRoles(), paginationMiddleware, getProjects);
projectRoutes.get("/get/:id", getProject);
projectRoutes.patch("/update/:id", updateProject);
projectRoutes.delete("/delete/:id", deleteProject);
projectRoutes.patch("/sortlist", sortList);
projectRoutes.patch("/apply", applyProject);

// SupplierAdmin routes
projectRoutes.get("/dashboard", authorizeRoles(userRoles.SupplierAdmin), getDashboardDataSupplierAdmin);

export default projectRoutes;

