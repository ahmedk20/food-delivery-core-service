import {AppError} from "../../common/error/AppError";

export const CannotCreateOwnerUserError = new AppError('Not allowed to create another owner', 400);
export const RoleNotFoundError = new AppError('Role not found', 404);
