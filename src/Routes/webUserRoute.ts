import * as express from 'express';
import { getWebUser, loginWebUser, registerSendMail, registerWebUser } from '../Controllers/webUserController';
import { authorizeRoles } from '../Middleware/verifyToken';

const webUserRoutes = express.Router();

webUserRoutes.post("/register", registerWebUser);
webUserRoutes.post("/login", loginWebUser);
webUserRoutes.post("/register/mail-send", registerSendMail);
webUserRoutes.get("/get", authorizeRoles(), getWebUser);

export default webUserRoutes;