import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './lib/config/env.js';
import { routes } from './routes.js';
import { correlationId } from './lib/correlation/correlationId.js';
import { resolveRegion } from './lib/sharding/region-resolver.js';
import { errorHandler } from './lib/error/errorHandler.js';

export function createApp() {
    const app = express();
    app.use(cors({ origin: env.cors.origins, credentials: true }));
    app.use(helmet());
    app.use(express.json());
    app.use(cookieParser());
    app.use(correlationId);
    app.use(resolveRegion);
    app.use('/api', routes);
    app.use(errorHandler);
    return app;
}
