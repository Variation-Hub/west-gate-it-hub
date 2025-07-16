import * as express from 'express';
import {
    createTechnology,
    createLanguage,
    deleteTechnology,
    deleteLanguage,
    getTechnologies,
    getLanguages,
    updateTechnology,
    updateLanguage,
    getPublicTechnologies,
    getCandidatesByTechnology
} from '../Controllers/techLanguageController';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';

const techLanguageRoute = express.Router();

techLanguageRoute.get("/technologies", authorizeRoles(), getTechnologies);
techLanguageRoute.get("/languages", authorizeRoles(), getLanguages);
techLanguageRoute.post("/technologies", authorizeRoles(), createTechnology);
techLanguageRoute.post("/languages", authorizeRoles(), createLanguage);
techLanguageRoute.delete("/technologies/:id", authorizeRoles(), deleteTechnology);
techLanguageRoute.delete("/languages/:id", authorizeRoles(), deleteLanguage);
techLanguageRoute.patch("/technologies/:id", authorizeRoles(), updateTechnology);
techLanguageRoute.patch("/languages/:id", authorizeRoles(), updateLanguage);
techLanguageRoute.get("/:technologyName/candidates", authorizeRoles(), getCandidatesByTechnology);

// Public routes
techLanguageRoute.get("/public/technologies", getPublicTechnologies);

export default techLanguageRoute;
