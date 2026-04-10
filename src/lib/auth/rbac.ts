import {Request, Response, NextFunction} from "express";
import {container} from "../di/container";
import {TOKENS} from "../di/tokens";
import {PermissionCacheService} from "../../app/rbac/service/permission-cache.service";
import {SystemRole} from "../../app/user/enums";
import {NotAuthenticated} from "./errors";

export interface RBACOptions {
    resource: string;
    action: string;
    allowSystemAdmin?: boolean; // by default will be true
}

export function rbac(options: RBACOptions) {
    return async(req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw NotAuthenticated;
            }
            const {resource, action, allowSystemAdmin = true} = options;

            // if he is a system admin -> bypass (bug fix: was !allowSystemAdmin)
            if (allowSystemAdmin && req.user.role == SystemRole.SYSTEM_ADMIN) {
                return next();
            }

            if (req.user.role == SystemRole.RESTAURANT_USER) {
                const permissionCacheService = container.resolve<PermissionCacheService>(TOKENS.PermissionCacheService);
                const permissions = await permissionCacheService.getPermissions(req.user.restaurantRole!);
                if (!permissionCacheService.hasPermission(permissions, resource, action)) {
                    return res.status(403).json({ error: "Permission denied" });
                }
                return next();
            }

            return res.status(403).json({ error: "Permission denied" });
        } catch (error) {
            next(error);
        }
    }
}

export function requireRestaurantMember(paramName: string = 'restaurantId') {
    return async(req: Request, res: Response, next: NextFunction) => {
        const restaurantId = parseInt(req.params[paramName] as string);
        if (!restaurantId) {
            return res.status(500).json({ message: "something went wrong" });
        }

        if (req.user?.role == SystemRole.SYSTEM_ADMIN) return next();

        if (Number(req.user?.restaurantId) !== Number(restaurantId)) {
            return res.status(403).json({ error: "Permission denied" });
        }
        next();
    }
}

export function requireBranchAccess(paramName: string = 'branchId') {
    return async(req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        // System admins and owners bypass
        if (req.user.role == SystemRole.SYSTEM_ADMIN || req.user.restaurantRole === 'owner') {
            return next();
        }

        const branchId = Number(req.params[paramName] ?? req.query[paramName]);
        if (!branchId) {
            return res.status(400).json({ error: "Branch ID is required" });
        }

        const branchIds: number[] = (req.user.branchIds as number[]) ?? [];
        if (!branchIds.includes(branchId)) {
            return res.status(403).json({ error: "Permission denied" });
        }

        next();
    }
}
