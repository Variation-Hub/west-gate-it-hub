import * as express from 'express';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { addCommentToTask, createTask, deleteCommentToTask, deleteTask, getTasks, removeTaskFromMyDay, updateCommentToTask, updateTask } from '../Controllers/taskController';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';

const taskRouter = express.Router();

taskRouter.get("/list", authorizeRoles(), paginationMiddleware, getTasks);
taskRouter.post("/create", authorizeRoles(), createTask)
taskRouter.patch("/update/:id", authorizeRoles(), updateTask);
taskRouter.patch("/remove-myday/:id", authorizeRoles(), removeTaskFromMyDay);
taskRouter.patch("/add-comment/:id", authorizeRoles(), addCommentToTask);
taskRouter.patch("/update-comment/:id", authorizeRoles(), updateCommentToTask);
taskRouter.patch("/delete-comment/:id", authorizeRoles(), deleteCommentToTask);
taskRouter.delete("/delete/:id", authorizeRoles(), deleteTask);

export default taskRouter;