import * as express from 'express';
import { createRole, updateRole, getAllRoles, getlistByRole, deleteRole, getCount } from '../Controllers/roleController';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';

const roleRoute = express.Router();

roleRoute.post("/add", authorizeRoles(), createRole);         
roleRoute.get("/get-list", authorizeRoles(), paginationMiddleware, getAllRoles);          
roleRoute.patch("/update/:id", authorizeRoles(),updateRole);         
roleRoute.delete("/delete/:id", authorizeRoles(), deleteRole);
roleRoute.get("/candidates/:id", authorizeRoles(), getlistByRole);
roleRoute.get("/candidates-count", authorizeRoles(), getCount);

export default roleRoute;