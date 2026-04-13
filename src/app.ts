import express from "express";
import {routes} from "./routes.js";
import cookieParser from "cookie-parser"
import {errorHandler} from "./lib/error/errorHandler";
import { correlationId } from './lib/correlation/correlationId';
import cors from "cors";
import {env} from "./lib/config/env";
import helmet from "helmet";

export function createApp(){
    const app = express();
    app.use(cors({origin: env.cors.origins, credentials: true}))
    app.use(helmet());
    app.use(express.json());
    app.use(cookieParser());
    app.use(correlationId);
    app.use('/api', routes);
    app.use(errorHandler);
    return app;

}
