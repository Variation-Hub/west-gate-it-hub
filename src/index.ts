import express from 'express';
import dotenv from 'dotenv';
dotenv.config()
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import MainRoutes from './Routes/main';
import { initSocket } from './socket/socket';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 4000;

// express config
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
app.use(morgan('tiny'))

// database connection
mongoose.connect(process.env.MONGODB_URL as string).then(() => {
    console.log('Connected to database');
}).catch((err: Error) => console.log(err));

// config mainRoute
app.use('/api/v1', MainRoutes);

const server = app.listen(port, () => {
    console.log(`Server is running at Port :: ${port} `);
    initSocket(server)
});
