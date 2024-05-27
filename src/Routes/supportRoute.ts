import * as express from 'express';
import { multipleFileUpload } from '../Util/multer';
import { authorizeRoles } from '../Middleware/verifyToken';
import { createSupportMessage, deleteSupportMessage, getSupportMessages, getUsersChattedWithUser } from '../Controllers/supportController';

const supportRoute = express.Router();

supportRoute.post("/create", authorizeRoles(), multipleFileUpload("files", 5), createSupportMessage);
supportRoute.delete("/delete/:id", authorizeRoles(), deleteSupportMessage);
supportRoute.get("/list", authorizeRoles(), getSupportMessages);
supportRoute.get("/user/list", authorizeRoles(), getUsersChattedWithUser);


export default supportRoute;