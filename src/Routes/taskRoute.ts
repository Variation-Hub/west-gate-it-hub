import * as express from 'express';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { addCommentToTask, createTask, deleteCommentToTask, deleteTask, getTasks, removeTaskFromMyDay, updateCommentToTask, updateTask,pinComment, addCandidate, addSubTask, deleteSubTask, getSubTasks, logoutAndCommentUnfinishedTasks, getCommentBoxData, getTask } from '../Controllers/taskController';
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
taskRouter.patch("/:taskId/comments/:commentId/pin", authorizeRoles(), pinComment);
taskRouter.post('/logout', authorizeRoles(), logoutAndCommentUnfinishedTasks);
taskRouter.get('/get-comments', authorizeRoles(), getCommentBoxData);
taskRouter.get('/detail/:id', authorizeRoles(), getTask);

//Sub-task
taskRouter.post("/:taskId/subtasks/add", authorizeRoles(), addSubTask);
taskRouter.delete("/:taskId/subtasks/:subtaskId", authorizeRoles(), deleteSubTask);
taskRouter.post("/:taskId/subtasks/:subtaskId/resources", authorizeRoles(), addCandidate);
taskRouter.get("/subtasks/:taskId", authorizeRoles(), getSubTasks);

export default taskRouter;