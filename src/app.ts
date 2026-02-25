import express from "express";
import {routes} from "./routes.js";
import cookieParser from "cookie-parser"

export function createApp(){
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api', routes);
    return app;

}
