import * as express from 'express';
import { singleFileUpload } from "../Util/multer";
import { createFOI, deleteFOI, getFIOs, updateFOI } from '../Controllers/foiController';


const foiRoutes = express.Router();

foiRoutes.post("/create", singleFileUpload("link"), createFOI);
foiRoutes.get("/list", getFIOs);
foiRoutes.patch("/update/:id", singleFileUpload("link"), updateFOI);
foiRoutes.delete("/delete/:id", deleteFOI);

export default foiRoutes;