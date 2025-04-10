import * as express from 'express';
import { selectUserForProject, addProjectStatusForSupplier, addProjectToMylist, applyProject, appointBidManagerToProject, appointUserToProject, approveOrRejectByAdmin, approveOrRejectFeasibilityStatus, createProject, deleteFiles, deleteProject, deleteProjectBidStatusComment, deleteProjectFailStatusReason, deleteProjectMultiple, deleteProjectStatusComment, deleteProjectdroppedAfterFeasibilityStatusReason, deleteProjectnosuppliermatchedStatusReason, getDashboardDataProjectCoOrdinator, getDashboardDataProjectManager, getDashboardDataSupplierAdmin, getDashboardDataUKWriter, getGapAnalysisData, getGapAnalysisDataDroppedAfterFeasibilityStatusReason, getGapAnalysisDatanosuppliermatchedStatusReason, getLatestProject, getProject, getProjectCountAndValueBasedOnStatus, getProjectLogs, getProjectSelectUser, getProjects, getSelectedUserDataUKWriter, getSupplierAdminList, mailSend, newProjectAddMail, sortList, updateProject, updateProjectForFeasibility, updateProjectForProjectManager, uploadFile, exportProjectsToCSV, deleteDocument, removeFromSortList } from '../Controllers/projectController';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';
import { authorizeRoles, authorizeRolesWithoutError } from '../Controllers/Middleware/verifyToken';
import { userRoles } from '../Util/contant';
import { multipleFileUpload } from '../Util/multer';
import { mailForNewProject } from '../Util/nodemailer';

const projectRoutes = express.Router();

projectRoutes.post("/create", authorizeRoles(), createProject);
projectRoutes.get("/list", paginationMiddleware, authorizeRolesWithoutError(), getProjects);
projectRoutes.get("/list/latest", getLatestProject);
projectRoutes.get("/get/:id", authorizeRoles(), getProject);
projectRoutes.patch("/update/:id", authorizeRoles(), updateProject);
projectRoutes.delete("/delete/:id", authorizeRoles(), deleteProject);
projectRoutes.delete("/delete-multiple", authorizeRoles(), deleteProjectMultiple);
projectRoutes.delete("/delete-comment/:id", authorizeRoles(), deleteProjectStatusComment);
projectRoutes.delete("/delete-failreason/:id", authorizeRoles(), deleteProjectFailStatusReason);
projectRoutes.delete("/delete-bidstatuscomment/:id", authorizeRoles(), deleteProjectBidStatusComment);
projectRoutes.delete("/delete-dafstatusreason/:id", authorizeRoles(), deleteProjectdroppedAfterFeasibilityStatusReason);
projectRoutes.delete("/delete-nosuppliearmatchedreason/:id", authorizeRoles(), deleteProjectnosuppliermatchedStatusReason);
projectRoutes.delete("/delete-document/:id", authorizeRoles(), deleteDocument);
projectRoutes.patch("/sortlist", authorizeRoles(), sortList);
projectRoutes.patch("/apply", authorizeRoles(), applyProject);
projectRoutes.post("/mail-send", authorizeRoles(), mailSend);
projectRoutes.post("/new-project-mail", authorizeRoles(), newProjectAddMail);
projectRoutes.get("/status-count-value", authorizeRoles(), getProjectCountAndValueBasedOnStatus);
projectRoutes.get("/logs/:id", authorizeRoles(), getProjectLogs);
projectRoutes.patch("/remove-from-sortlist", authorizeRoles(), removeFromSortList);
projectRoutes.patch("/select-from-sortlist", authorizeRoles(), selectUserForProject);

// File upload routes
projectRoutes.post("/upload", authorizeRoles(), multipleFileUpload('files', 5), uploadFile);
projectRoutes.delete("/upload/delete", authorizeRoles(), deleteFiles);

// SupplierAdmin routes
projectRoutes.get("/dashboard", authorizeRoles(userRoles.SupplierAdmin, userRoles.Admin), getDashboardDataSupplierAdmin);
projectRoutes.patch("/add-status", authorizeRoles(), addProjectStatusForSupplier);
projectRoutes.get("/gap-analysis", authorizeRoles(), getGapAnalysisData);
projectRoutes.get("/gap-analysis-dafstatus-reason", authorizeRoles(), getGapAnalysisDataDroppedAfterFeasibilityStatusReason);
projectRoutes.get("/gap-analysis-nosuppliermatched-reason", authorizeRoles(), getGapAnalysisDatanosuppliermatchedStatusReason);
projectRoutes.patch("/update/approve-reject-admin/:id", authorizeRoles(), approveOrRejectByAdmin);

// ProjectManager routes
projectRoutes.get("/project-manager/dashboard", authorizeRoles(userRoles.ProjectManager, userRoles.Admin), getDashboardDataProjectManager);
projectRoutes.get("/supplier-admin/list/:projectId", authorizeRoles(userRoles.ProjectManager, userRoles.Admin), getSupplierAdminList);
projectRoutes.patch("/update/project-manager/:id", authorizeRoles(userRoles.ProjectManager, userRoles.Admin), updateProjectForProjectManager);
projectRoutes.patch("/update/appoint-bidmanager/:id", authorizeRoles(), appointBidManagerToProject);
projectRoutes.patch("/update/my-list/:id", authorizeRoles(), addProjectToMylist);


// FeasibilityUser routes
projectRoutes.patch("/update/Feasibility/:id", authorizeRoles(), updateProjectForFeasibility);
projectRoutes.patch("/update/appoint-user/:id", authorizeRoles(), appointUserToProject);
projectRoutes.patch("/update/approve-reject/:id", authorizeRoles(), approveOrRejectFeasibilityStatus);

// UKWriter routes
projectRoutes.get("/ukwriter/dashboard", authorizeRoles(), getDashboardDataUKWriter);
projectRoutes.get("/ukwriter/selected-user/:id", authorizeRoles(), getSelectedUserDataUKWriter);
projectRoutes.get("/ukwriter/supplier-user/:projectId", authorizeRoles(userRoles.UKWriter, userRoles.Admin), getProjectSelectUser);

// Project Co-ordinator
projectRoutes.get("/project-coordinator/dashboard", authorizeRoles(userRoles.ProjectCoOrdinator, userRoles.Admin), getDashboardDataProjectCoOrdinator);

// export projects
projectRoutes.get("/export-csv", exportProjectsToCSV);

export default projectRoutes;

