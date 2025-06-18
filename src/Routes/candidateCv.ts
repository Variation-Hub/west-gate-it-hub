import * as express from 'express';
import { createCandidateCV, updateCandidate, getAllCandidates, getCandidateById, deleteCandidate, getCandidatesBySupplierId, getCandidates, getCandidateFilters, getCandidatesByFilters, saveCandidateFilter, getRoleList, getCandidatesByFilterId, deleteCandidateFilter } from '../Controllers/candidateCvController';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';

const candidateCvRoute = express.Router();

candidateCvRoute.post("/add", authorizeRoles(), createCandidateCV);         
candidateCvRoute.get("/get-list", authorizeRoles(), paginationMiddleware, getAllCandidates);          
candidateCvRoute.get("/get/:id", authorizeRoles(), getCandidateById);       
candidateCvRoute.patch("/update/:id", authorizeRoles(),updateCandidate);         
candidateCvRoute.delete("/delete/:id", authorizeRoles(), deleteCandidate);
candidateCvRoute.get("/list/:supplierId", authorizeRoles(), paginationMiddleware, getCandidatesBySupplierId);

// Filter routes
candidateCvRoute.get("/filters", authorizeRoles(), getCandidateFilters);
candidateCvRoute.get("/filtered", authorizeRoles(), paginationMiddleware, getCandidatesByFilters);

// Saved filter routes
candidateCvRoute.post("/save-filter", authorizeRoles(), saveCandidateFilter);
candidateCvRoute.get("/filter-list", authorizeRoles(), getRoleList);
candidateCvRoute.get("/filter/:filterId/candidates", authorizeRoles(), paginationMiddleware, getCandidatesByFilterId);
candidateCvRoute.delete("/filter/:filterId", authorizeRoles(), deleteCandidateFilter);

//Public route
candidateCvRoute.get("/public/get-list", paginationMiddleware, getCandidates);
export default candidateCvRoute;