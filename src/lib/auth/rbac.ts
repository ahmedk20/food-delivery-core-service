import { Request, Response, NextFunction } from 'express';
import { SystemRole } from './roles.js';
import { NotAuthenticated, NotAuthorized } from './errors.js';

export interface RBACOptions {
    resource: string;
    action: string;
}

/**
 * Permission check for restaurant_user role.
 * Resolves the role's permission list from Redis key `core:rbac:perms:{roleName}`
 * (populated by the core service, TTL 5 min).
 * The CoreServiceClient.getRolePermissions() cache layer is wired in Phase 2.
 * Until then this function is a stub — Phase 2 replaces the inner logic.
 */
export function rbac(options: RBACOptions) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) return next(NotAuthenticated);

            if (req.user.role === SystemRole.SYSTEM_ADMIN) return next();

            if (req.user.role === SystemRole.RESTAURANT_USER) {
                // TODO Phase 2: resolve from cache.get(`core:rbac:perms:${req.user.restaurantRole}`)
                // For now, allow through — Phase 2 wires the real check.
                return next();
            }

            next(NotAuthorized);
        } catch (err) {
            next(err);
        }
    };
}
