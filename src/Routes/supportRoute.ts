import * as express from 'express';
import { multipleFileUpload } from '../Util/multer';
// import { authorizeRoles } from '../Middleware/verifyToken';
import { createSupportMessage, deleteSupportMessage, getSupportMessages, getUsersChattedWithUser } from '../Controllers/supportController';

const supportRoute = express.Router();

supportRoute.post("/create", multipleFileUpload("files", 5), createSupportMessage);
supportRoute.delete("/delete/:id", deleteSupportMessage);
supportRoute.get("/list", getSupportMessages);
supportRoute.get("/user/list", getUsersChattedWithUser);


export default supportRoute;