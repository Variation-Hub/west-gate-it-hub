import * as express from 'express';
import { getWebUser, loginWebUser, registerSendMail, registerWebUser, uploadFile, deleteFile, getAllExpertise, getAllExpertise2, getSuppliersByExpertise, updateSupplierExpertise, getAlldata, promoteOtherItem, addCustomItem, getAllSubExpertise, addSubExpertiseToSupplier, deleteExpertise, deleteSubExpertise, getlanguages, deleteMasterListExpertise, resetPassword, userForgotPassword, getWebUserPublic, syncMasterListItemTags, getAllExpertiseOnly, getUnapprovedExpertise } from '../Controllers/webUserController';
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
webUserRoutes.delete("/expertise/:id", authorizeRoles(), deleteMasterListExpertise);
webUserRoutes.post("/reset-password", resetPassword);
webUserRoutes.post("/forgot", userForgotPassword);

// drop down data
webUserRoutes.get("/drop-down", authorizeRoles(), getAllExpertise2);
webUserRoutes.get("/drop-down-list", authorizeRoles(), getAlldata);
webUserRoutes.post("/masterlist/promote", authorizeRoles(), promoteOtherItem);
webUserRoutes.post("/masterlist/custom", authorizeRoles(), addCustomItem);
webUserRoutes.get("/masterlist/unapproved", authorizeRoles(), getUnapprovedExpertise);
webUserRoutes.put("/masterlist/:id/tags", authorizeRoles(), syncMasterListItemTags);
webUserRoutes.get("/sub-expertise/list", authorizeRoles(), getAllSubExpertise);
webUserRoutes.post("/add-sub-expertise", authorizeRoles(), addSubExpertiseToSupplier);
webUserRoutes.delete("/expertise/:itemId", authorizeRoles(), deleteExpertise);
webUserRoutes.delete("/expertise/:itemId/subexpertise", authorizeRoles(), deleteSubExpertise);
webUserRoutes.get("/get-languages", authorizeRoles(), getlanguages);

// Public available
webUserRoutes.get("/public/drop-down-list", getAlldata);
webUserRoutes.get("/public/sub-expertise/list", getAllSubExpertise);
webUserRoutes.get("/public/drop-down", getAllExpertise2);   
webUserRoutes.get("/public/get/:id", getWebUserPublic);
webUserRoutes.get("/public/expertise-list", getAllExpertiseOnly);

export default webUserRoutes;