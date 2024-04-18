import * as express from 'express';
import { createProject, deleteProject, getProject, getProjects, updateProject } from '../Controllers/projectController';

const projectRoutes = express.Router();

projectRoutes.post("/create", createProject);
projectRoutes.get("/list", getProjects);
projectRoutes.get("/get/:id", getProject);
projectRoutes.patch("/update/:id", updateProject);
projectRoutes.delete("/delete/:id", deleteProject);

export default projectRoutes;

