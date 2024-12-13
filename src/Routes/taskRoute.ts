import * as express from 'express';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { addCommentToTask, createTask, deleteTask, getTasks, updateTask } from '../Controllers/taskController';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';

const taskRouter = express.Router();

taskRouter.get("/list", authorizeRoles(), paginationMiddleware, getTasks);
taskRouter.post("/create", authorizeRoles(), createTask)
taskRouter.patch("/update/:id", authorizeRoles(), updateTask);
taskRouter.patch("/add-comment/:id", authorizeRoles(), addCommentToTask);
taskRouter.delete("/delete/:id", authorizeRoles(), deleteTask);

export default taskRouter;