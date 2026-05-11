import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireInternalHmac } from '../../lib/auth/internal.js';
import { sendSuccess } from '../../lib/http/response.js';
import { findProductByIdWithBranch } from '../product/repository/product.repository.js';
import { findAddressById } from '../customer/repository/address.repo.js';
import { findUserById } from '../user/repository/users.repo.js';
import { getPermissionsDetailsByRoleName } from '../member/repository/permission.repo.js';
import AppError from '../../lib/error/AppError.js';

export const internalRouter = Router();

internalRouter.use(requireInternalHmac);

internalRouter.get(
    '/products/:id/branch/:branchId',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string);
            const branchId = parseInt(req.params.branchId as string);
            const product = await findProductByIdWithBranch(id, branchId);
            if (!product) return next(new AppError('Product not found', 404));
            sendSuccess(res, {
                id: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
                price: product.price,
                stock: product.stock,
                isAvailable: product.isAvailable,
                restaurantId: product.restaurantId,
            });
        } catch (err) {
            next(err);
        }
    },
);

internalRouter.get(
    '/customer/addresses/:id',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string);
            const address = await findAddressById(id);
            if (!address) return next(new AppError('Address not found', 404));
            sendSuccess(res, address);
        } catch (err) {
            next(err);
        }
    },
);

internalRouter.get(
    '/users/:id',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string);
            const user = await findUserById(id);
            if (!user || user.deletedAt !== null) return next(new AppError('User not found', 404));
            sendSuccess(res, {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                systemRole: user.systemRole,
            });
        } catch (err) {
            next(err);
        }
    },
);

internalRouter.get(
    '/roles/:role/permissions',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const role = req.params.role as string;
            const permissions = await getPermissionsDetailsByRoleName(role);
            sendSuccess(res, { role, permissions });
        } catch (err) {
            next(err);
        }
    },
);
