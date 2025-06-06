import * as express from 'express';
import { createRole, updateRole, getAllRoles, getlistByRole, deleteRole, getCount, roleList, getTechnologies } from '../Controllers/roleController';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';

const roleRoute = express.Router();

roleRoute.post("/add", authorizeRoles(), createRole);         
roleRoute.get("/get-list", authorizeRoles(), getAllRoles);          
roleRoute.patch("/update/:id", authorizeRoles(),updateRole);         
roleRoute.delete("/delete/:id", authorizeRoles(), deleteRole);
roleRoute.get("/candidates/:id", authorizeRoles(), getlistByRole);
roleRoute.get("/candidates-count", authorizeRoles(), getCount);
roleRoute.get("/get-all", authorizeRoles(), roleList);
roleRoute.get("/get-technologies", authorizeRoles(), getTechnologies);

// Public available roles
roleRoute.get("/public/get-technologies", getTechnologies);
roleRoute.get("/public/get-list", getAllRoles);  

export default roleRoute;