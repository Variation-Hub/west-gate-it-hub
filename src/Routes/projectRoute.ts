import * as express from 'express';
import { applyProject, createProject, deleteFiles, deleteProject, getDashboardDataProjectCoOrdinator, getDashboardDataProjectManager, getDashboardDataSupplierAdmin, getDashboardDataUKWriter, getProject, getProjectSelectUser, getProjects, getSelectedUserDataUKWriter, getSupplierAdminList, sortList, updateProject, updateProjectForFeasibility, updateProjectForProjectManager, uploadFile } from '../Controllers/projectController';
import { paginationMiddleware } from '../Middleware/pagination';
import { authorizeRoles } from '../Middleware/verifyToken';
import { userRoles } from '../Util/contant';
import { multipleFileUpload } from '../Util/multer';

const projectRoutes = express.Router();

projectRoutes.post("/create", authorizeRoles(), createProject);
projectRoutes.get("/list", authorizeRoles(), paginationMiddleware, getProjects);
projectRoutes.get("/get/:id", authorizeRoles(), getProject);
projectRoutes.patch("/update/:id", authorizeRoles(), updateProject);
projectRoutes.delete("/delete/:id", authorizeRoles(), deleteProject);
projectRoutes.patch("/sortlist", authorizeRoles(), sortList);
projectRoutes.patch("/apply", authorizeRoles(), applyProject);

// File upload routes
projectRoutes.post("/upload", authorizeRoles(), multipleFileUpload('files', 5), uploadFile);
projectRoutes.delete("/upload/delete", authorizeRoles(), deleteFiles);

// SupplierAdmin routes
projectRoutes.get("/dashboard", authorizeRoles(userRoles.SupplierAdmin), getDashboardDataSupplierAdmin);

// ProjectManager routes
projectRoutes.get("/project-manager/dashboard", authorizeRoles(userRoles.ProjectManager), getDashboardDataProjectManager);
projectRoutes.get("/supplier-admin/list/:projectId", authorizeRoles(userRoles.ProjectManager), getSupplierAdminList);
projectRoutes.patch("/update/project-manager/:id", authorizeRoles(userRoles.ProjectManager), updateProjectForProjectManager);

// FeasibilityUser routes
projectRoutes.patch("/update/Feasibility/:id", authorizeRoles(userRoles.FeasibilityAdmin, userRoles.FeasibilityUser), updateProjectForFeasibility);

// UKWriter routes
projectRoutes.get("/ukwriter/dashboard", authorizeRoles(userRoles.UKWriter), getDashboardDataUKWriter);
projectRoutes.get("/ukwriter/selected-user/:id", authorizeRoles(userRoles.UKWriter), getSelectedUserDataUKWriter);
projectRoutes.get("/ukwriter/supplier-user/:projectId", authorizeRoles(userRoles.UKWriter), getProjectSelectUser);

// Project Co-ordinator
projectRoutes.get("/project-coordinator/dashboard", authorizeRoles(userRoles.ProjectCoOrdinator), getDashboardDataProjectCoOrdinator);

export default projectRoutes;

