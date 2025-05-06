import * as express from 'express';
import { 
    createSubExpertise, 
    deleteSubExpertise,
    getAllSubExpertise
} from '../Controllers/subExpertiseController';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';

const subExpertiseRoute = express.Router();

subExpertiseRoute.get("/list", authorizeRoles(), getAllSubExpertise);
subExpertiseRoute.post("/add", authorizeRoles(), createSubExpertise);
subExpertiseRoute.delete("/delete/:id", authorizeRoles(), deleteSubExpertise);

export default subExpertiseRoute;
