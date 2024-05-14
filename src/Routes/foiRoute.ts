import * as express from 'express';
import { singleFileUpload } from "../Util/multer";
import { createFOI, deleteFOI, getFIOs, updateFOI } from '../Controllers/foiController';
import { paginationMiddleware } from '../Middleware/pagination';
import { authorizeRoles } from '../Middleware/verifyToken';
import { userRoles } from '../Util/contant';


const foiRoutes = express.Router();

foiRoutes.post("/create", authorizeRoles(userRoles.BOS, userRoles.Admin), singleFileUpload("link"), createFOI);
foiRoutes.get("/list", authorizeRoles(userRoles.BOS, userRoles.Admin), paginationMiddleware, getFIOs);
foiRoutes.patch("/update/:id", authorizeRoles(userRoles.BOS, userRoles.Admin), singleFileUpload("link"), updateFOI);
foiRoutes.delete("/delete/:id", authorizeRoles(userRoles.BOS, userRoles.Admin), deleteFOI);

export default foiRoutes;