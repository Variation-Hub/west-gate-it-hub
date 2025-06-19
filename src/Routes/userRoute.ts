import * as express from 'express';
import {
    createUser,
    deleteUser,
    loginUser,
    updateUser,
    userPasswordChange,
    userForgotPassword,
    createSuplierUser,
    fetchSuplierUser,
    updateSuplierAdmin,
    updateAvatar,
    getUserDetails,
    getUserList,
    getAdminDashboardData,
    getAdminDashboardSuppliersStatistics,
    connectUserToSocket,
    fetchSuplierAdmin,
    getSupplierDetails,
    GetUserLogin,
    fetchSupplierWithProjectStatus,
    resetPassword,
    publicUpdateUser,
    publicSuplierAdmin
} from '../Controllers/userController';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { userRoles } from '../Util/contant';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';
import { singleFileUpload } from '../Util/multer';

const userRoutes = express.Router();

userRoutes.post("/register", createUser);
userRoutes.post("/login", loginUser);
userRoutes.patch("/update/:id", authorizeRoles(), updateUser);
userRoutes.delete("/delete", authorizeRoles(), deleteUser);
userRoutes.patch("/change-password/:id", authorizeRoles(), userPasswordChange);
userRoutes.post("/forgot", userForgotPassword);
userRoutes.patch("/avatar-upload", authorizeRoles(), singleFileUpload("avatar"), updateAvatar);
userRoutes.get("/get", authorizeRoles(), getUserDetails);
userRoutes.get("/list", authorizeRoles(), getUserList);
userRoutes.post("/connect", authorizeRoles(), connectUserToSocket);
userRoutes.get("/login-details/:id", authorizeRoles(), GetUserLogin);
userRoutes.post("/reset-password", resetPassword);

// Supplier APIs
userRoutes.post("/suplier/register", authorizeRoles(userRoles.SupplierAdmin, userRoles.Admin), createSuplierUser);
userRoutes.get("/suplier", authorizeRoles(userRoles.SupplierAdmin, userRoles.Admin, userRoles.BOS), paginationMiddleware, fetchSuplierUser);
userRoutes.get("/suplier/list", authorizeRoles(), paginationMiddleware, fetchSuplierAdmin);
userRoutes.patch("/suplier/cv-upload", authorizeRoles(userRoles.SupplierAdmin, userRoles.Admin), singleFileUpload("cv"),
    updateSuplierAdmin);
userRoutes.get("/suplier/get/:id", authorizeRoles(), getSupplierDetails);
userRoutes.get("/supplier/project/list", authorizeRoles(), paginationMiddleware, fetchSupplierWithProjectStatus);

// Admin APIs
userRoutes.get("/admin/dashboard", authorizeRoles(), getAdminDashboardData)
userRoutes.get("/admin/suppleir-statictics", authorizeRoles(), getAdminDashboardSuppliersStatistics)

// public update API 
userRoutes.patch("/public/update/:id", publicUpdateUser);
userRoutes.get("/public/suplier/list", paginationMiddleware, publicSuplierAdmin);
export default userRoutes;