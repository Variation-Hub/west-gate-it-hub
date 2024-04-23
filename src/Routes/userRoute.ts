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
    updateAvatar
} from '../Controllers/userController';
import { authorizeRoles } from '../Middleware/verifyToken';
import { userRoles } from '../Util/contant';
import { paginationMiddleware } from '../Middleware/pagination';
import { singleFileUpload } from '../Util/multer';

const userRoutes = express.Router();

userRoutes.post("/register", createUser);
userRoutes.post("/login", loginUser);
userRoutes.patch("/update/:id", updateUser);
userRoutes.delete("/delete/:id", deleteUser);
userRoutes.patch("/change-password/:id", userPasswordChange);
userRoutes.post("/forgot", userForgotPassword);
userRoutes.patch("/avatar-upload", authorizeRoles(), singleFileUpload("avatar"), updateAvatar);


// Supplier APIs
userRoutes.post("/suplier/register", authorizeRoles(userRoles.SupplierAdmin), createSuplierUser);
userRoutes.get("/suplier", authorizeRoles(userRoles.SupplierAdmin), paginationMiddleware, fetchSuplierUser);
userRoutes.patch("/suplier/cv-upload", authorizeRoles(userRoles.SupplierAdmin), singleFileUpload("cv"), updateSuplierAdmin);

export default userRoutes;