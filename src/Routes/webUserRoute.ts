import * as express from 'express';
import { loginWebUser, registerWebUser } from '../Controllers/webUserController';

const webUserRoutes = express.Router();

webUserRoutes.post("/register", registerWebUser);
webUserRoutes.post("/login", loginWebUser);

export default webUserRoutes;