import * as express from 'express';
import { getWebUser, loginWebUser, registerSendMail, registerWebUser, uploadFile, deleteFile, getAllExpertise, getSuppliersByExpertise, updateSupplierExpertise, getAlldata, promoteOtherItem, addCustomItem } from '../Controllers/webUserController';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { multipleFileUpload } from '../Util/multer';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';

const webUserRoutes = express.Router();

webUserRoutes.post("/register", registerWebUser);
webUserRoutes.post("/login", loginWebUser);
webUserRoutes.post("/register/mail-send", registerSendMail);
webUserRoutes.get("/get", authorizeRoles(), getWebUser);
webUserRoutes.post("/uploadByTag", authorizeRoles(), multipleFileUpload('files', 5), uploadFile);
webUserRoutes.delete("/deleteFile", authorizeRoles(), deleteFile);
webUserRoutes.get("/expertise-list", authorizeRoles(), getAllExpertise);
webUserRoutes.get("/get-suppliers", authorizeRoles(), getSuppliersByExpertise);
webUserRoutes.post("/add-expertise", authorizeRoles(), updateSupplierExpertise);

// drop down data
webUserRoutes.get("/drop-down", authorizeRoles(), paginationMiddleware, getAlldata);
webUserRoutes.post("/masterlist/promote", authorizeRoles(), promoteOtherItem);
webUserRoutes.post("/masterlist/custom", authorizeRoles(), addCustomItem);
export default webUserRoutes;