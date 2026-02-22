import AppError from "../../common/error/AppError";

export const UserAlreadyExists = new AppError('User Already Exists with same email or phone number',400);
export const CannotSignAsSystemAdmin = new AppError('User Cannot register as system admin',403);
