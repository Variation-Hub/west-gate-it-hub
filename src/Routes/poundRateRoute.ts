import * as express from 'express';
import {
    getLatestPoundRate,
    createOrUpdatePoundRate
} from '../Controllers/poundRateController';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { userRoles } from '../Util/contant';

const poundRateRoute = express.Router();

poundRateRoute.get("/", getLatestPoundRate);

poundRateRoute.post("/", authorizeRoles(userRoles.Admin), createOrUpdatePoundRate);

export default poundRateRoute;
