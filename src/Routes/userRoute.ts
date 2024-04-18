import * as express from 'express';
import { createUser, deleteUser, loginUser, updateUser, userPasswordChange } from '../Controllers/userController';

const userRoutes = express.Router();

userRoutes.post("/register", createUser);
userRoutes.post("/login", loginUser);
userRoutes.patch("/update/:id", updateUser);
userRoutes.delete("/delete/:id", deleteUser);
userRoutes.patch("/change-password/:id", userPasswordChange);

export default userRoutes;