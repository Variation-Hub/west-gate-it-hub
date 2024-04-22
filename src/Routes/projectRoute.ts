import * as express from 'express';
import { applyProject, createProject, deleteProject, getProject, getProjects, sortList, updateProject } from '../Controllers/projectController';

const projectRoutes = express.Router();

projectRoutes.post("/create", createProject);
projectRoutes.get("/list", getProjects);
projectRoutes.get("/get/:id", getProject);
projectRoutes.patch("/update/:id", updateProject);
projectRoutes.delete("/delete/:id", deleteProject);
projectRoutes.patch("/sortlist", sortList);
projectRoutes.patch("/apply", applyProject);

export default projectRoutes;

