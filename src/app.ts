import express from "express";
import {routes} from "./routes.js";
import cookieParser from "cookie-parser"
import {errorHandler} from "./lib/error/errorHandler";
import { correlationId } from './lib/correlation/correlationId';

export function createApp(){
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(correlationId);
    app.use('/api', routes);
    app.use(errorHandler);
    return app;

}
