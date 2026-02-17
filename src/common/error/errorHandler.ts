import { Request, Response, NextFunction } from "express";
import logger from "./../logger/logger.js"

interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export default function errorHandler(
    err: AppError,
    req: Request & { correlationId?: string },
    res: Response,
    next: NextFunction
): Response {
    const statusCode = err.statusCode ?? 500;
    const operational = err.isOperational ?? false;

    logger.error(err.message, {
        statusCode,
        stack: err.stack,
        operational,
        body: req.body,
        correlationId: req.correlationId,
    });

    if (operational) {
        return res.status(statusCode).json({
            error: err.message,
        });
    }

    return res.status(500).json({
        error: "Something went wrong",
    });
}
