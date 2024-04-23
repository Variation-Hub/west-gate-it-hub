import * as express from 'express';
import { singleFileUpload } from "../Util/multer";
import { createFOI, deleteFOI, getFIOs, updateFOI } from '../Controllers/foiController';
import { paginationMiddleware } from '../Middleware/pagination';


const foiRoutes = express.Router();

foiRoutes.post("/create", singleFileUpload("link"), createFOI);
foiRoutes.get("/list", paginationMiddleware, getFIOs);
foiRoutes.patch("/update/:id", singleFileUpload("link"), updateFOI);
foiRoutes.delete("/delete/:id", deleteFOI);

export default foiRoutes;