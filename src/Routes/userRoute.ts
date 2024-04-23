import * as express from 'express';
import {
    createUser,
    deleteUser,
    loginUser,
    updateUser,
    userPasswordChange,
    userForgotPassword,
    createSuplierUser,
    fetchSuplierUser
} from '../Controllers/userController';
import { authorizeRoles } from '../Middleware/verifyToken';
import { userRoles } from '../Util/contant';

const userRoutes = express.Router();

userRoutes.post("/register", createUser);
userRoutes.post("/login", loginUser);
userRoutes.patch("/update/:id", updateUser);
userRoutes.delete("/delete/:id", deleteUser);
userRoutes.patch("/change-password/:id", userPasswordChange);
userRoutes.post("/forgot", userForgotPassword);

// Supplier APIs
userRoutes.post("/suplier/register", authorizeRoles(userRoles.SupplierAdmin), createSuplierUser);
userRoutes.get("/suplier", authorizeRoles(userRoles.SupplierAdmin), fetchSuplierUser);

export default userRoutes;