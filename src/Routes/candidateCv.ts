import * as express from 'express';
import { createCandidateCV, updateCandidate, getAllCandidates, getCandidateById, deleteCandidate, getCandidatesBySupplierId } from '../Controllers/candidateCvController';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';

const candidateCvRoute = express.Router();

candidateCvRoute.post("/add", authorizeRoles(), createCandidateCV);         
candidateCvRoute.get("/get-list", authorizeRoles(), paginationMiddleware, getAllCandidates);          
candidateCvRoute.get("/get/:id", authorizeRoles(), getCandidateById);       
candidateCvRoute.patch("/update/:id", authorizeRoles(),updateCandidate);         
candidateCvRoute.delete("/delete/:id", authorizeRoles(), deleteCandidate);
candidateCvRoute.get("/list/:supplierId", authorizeRoles(), paginationMiddleware, getCandidatesBySupplierId);

//Public route
candidateCvRoute.get("/public/get-list", getAllCandidates); 
export default candidateCvRoute;