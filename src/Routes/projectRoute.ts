import * as express from 'express';
import { applyProject, createProject, deleteFiles, deleteProject, getDashboardDataProjectCoOrdinator, getDashboardDataProjectManager, getDashboardDataSupplierAdmin, getDashboardDataUKWriter, getLatestProject, getProject, getProjectSelectUser, getProjects, getSelectedUserDataUKWriter, getSupplierAdminList, sortList, updateProject, updateProjectForFeasibility, updateProjectForProjectManager, uploadFile } from '../Controllers/projectController';
import { paginationMiddleware } from '../Middleware/pagination';
import { authorizeRoles } from '../Middleware/verifyToken';
import { userRoles } from '../Util/contant';
import { multipleFileUpload } from '../Util/multer';

const projectRoutes = express.Router();

projectRoutes.post("/create", authorizeRoles(), createProject);
projectRoutes.get("/list", authorizeRoles(), paginationMiddleware, getProjects);
projectRoutes.get("/list/latest", getLatestProject);
projectRoutes.get("/get/:id", authorizeRoles(), getProject);
projectRoutes.patch("/update/:id", authorizeRoles(), updateProject);
projectRoutes.delete("/delete/:id", authorizeRoles(), deleteProject);
projectRoutes.patch("/sortlist", authorizeRoles(), sortList);
projectRoutes.patch("/apply", authorizeRoles(), applyProject);

// File upload routes
projectRoutes.post("/upload", authorizeRoles(), multipleFileUpload('files', 5), uploadFile);
projectRoutes.delete("/upload/delete", authorizeRoles(), deleteFiles);

// SupplierAdmin routes
projectRoutes.get("/dashboard", authorizeRoles(userRoles.SupplierAdmin, userRoles.Admin), getDashboardDataSupplierAdmin);

// ProjectManager routes
projectRoutes.get("/project-manager/dashboard", authorizeRoles(userRoles.ProjectManager, userRoles.Admin), getDashboardDataProjectManager);
projectRoutes.get("/supplier-admin/list/:projectId", authorizeRoles(userRoles.ProjectManager, userRoles.Admin), getSupplierAdminList);
projectRoutes.patch("/update/project-manager/:id", authorizeRoles(userRoles.ProjectManager, userRoles.Admin), updateProjectForProjectManager);

// FeasibilityUser routes
projectRoutes.patch("/update/Feasibility/:id", authorizeRoles(userRoles.FeasibilityAdmin, userRoles.FeasibilityUser, userRoles.Admin), updateProjectForFeasibility);

// UKWriter routes
projectRoutes.get("/ukwriter/dashboard", authorizeRoles(), getDashboardDataUKWriter);
projectRoutes.get("/ukwriter/selected-user/:id", authorizeRoles(userRoles.UKWriter, userRoles.Admin), getSelectedUserDataUKWriter);
projectRoutes.get("/ukwriter/supplier-user/:projectId", authorizeRoles(userRoles.UKWriter, userRoles.Admin), getProjectSelectUser);

// Project Co-ordinator
projectRoutes.get("/project-coordinator/dashboard", authorizeRoles(userRoles.ProjectCoOrdinator, userRoles.Admin), getDashboardDataProjectCoOrdinator);

export default projectRoutes;

