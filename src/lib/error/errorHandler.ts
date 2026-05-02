import type {Request, Response, NextFunction} from "express";
import logger from "../logger/logger.js";
import type AppError from "./AppError.js";

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction) {
    const statusCode = err.statusCode ?? 500;
    const operational = err.isOperational ?? false;

    logger.error(err.message, {
        statusCode,
        stack: err.stack,
        operational,
        body: req.body,
        correlationId: req.correlationId
    })

    if (operational) {
        return res.status(statusCode).json({
            error: err.message,
        })
    }
    return res.status(500).json({
        error: 'Something went wrong',
    })
}
