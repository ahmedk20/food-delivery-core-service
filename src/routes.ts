import { Router } from 'express';
import { healthRouter } from './app/health/health.routes.js';

export const routes = Router();

routes.use('/health', healthRouter);

// Phase 3+: order, payment, delivery, agent, restaurant-orders, admin routes added here
