import * as express from 'express';
import { getAllTags, createTag, updateTag, deleteTag } from '../Controllers/tagController';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';

const tagRoute = express.Router();

// Protected routes (admin only)
tagRoute.get("/", authorizeRoles(), getAllTags);
tagRoute.post("/add", authorizeRoles(), createTag);
tagRoute.patch("/update/:id", authorizeRoles(), updateTag);
tagRoute.delete("/delete/:id", authorizeRoles(), deleteTag);

// Public routes
tagRoute.get("/public", getAllTags);

export default tagRoute;
