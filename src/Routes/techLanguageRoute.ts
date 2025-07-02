import * as express from 'express';
import { 
    createTechnology, 
    createLanguage, 
    deleteTechnology, 
    deleteLanguage,
    getTechnologies,
    getLanguages,
    updateTechnology,
    updateLanguage
} from '../Controllers/techLanguageController';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';

const techLanguageRoute = express.Router();

techLanguageRoute.get("/technologies", authorizeRoles(), getTechnologies);
techLanguageRoute.get("/languages", authorizeRoles(), getLanguages);
techLanguageRoute.post("/technologies", authorizeRoles(), createTechnology);
techLanguageRoute.post("/languages", authorizeRoles(), createLanguage);
techLanguageRoute.delete("/technologies/:id", authorizeRoles(), deleteTechnology);
techLanguageRoute.delete("/languages/:id", authorizeRoles(), deleteLanguage);
techLanguageRoute.patch("/technologies/:id", authorizeRoles(), updateTechnology);
techLanguageRoute.patch("/languages/:id", authorizeRoles(), updateLanguage);

export default techLanguageRoute;
