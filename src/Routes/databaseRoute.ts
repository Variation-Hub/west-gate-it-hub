import * as express from 'express';
import { exportDatabaseToCSV } from '../Controllers/databaseController';

const databaseRoute = express.Router();

databaseRoute.get("/export", exportDatabaseToCSV);

export default databaseRoute;