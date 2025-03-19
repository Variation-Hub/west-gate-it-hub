import * as express from 'express';
import { getWebUser, loginWebUser, registerSendMail, registerWebUser, uploadFile, deleteFile } from '../Controllers/webUserController';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { multipleFileUpload } from '../Util/multer';

const webUserRoutes = express.Router();

webUserRoutes.post("/register", registerWebUser);
webUserRoutes.post("/login", loginWebUser);
webUserRoutes.post("/register/mail-send", registerSendMail);
webUserRoutes.get("/get", authorizeRoles(), getWebUser);
webUserRoutes.post("/uploadByTag", authorizeRoles(), multipleFileUpload('files', 5), uploadFile);
webUserRoutes.delete("/deleteFile", authorizeRoles(), deleteFile);

export default webUserRoutes;