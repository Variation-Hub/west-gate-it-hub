import * as express from 'express';
import { loginWebUser, registerSendMail, registerWebUser } from '../Controllers/webUserController';

const webUserRoutes = express.Router();

webUserRoutes.post("/register", registerWebUser);
webUserRoutes.post("/login", loginWebUser);
webUserRoutes.post("/register/mail-send", registerSendMail);

export default webUserRoutes;