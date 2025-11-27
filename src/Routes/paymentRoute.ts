import * as express from 'express';
import { generateHash } from '../Controllers/paymentController';

const paymentRouter = express.Router();

paymentRouter.post("/generate-hash", generateHash);

export default paymentRouter;