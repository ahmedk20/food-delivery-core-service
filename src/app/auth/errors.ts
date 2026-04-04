import AppError from "../../common/error/AppError";

export const UserAlreadyExists = () => new AppError('User Already Exists with same email or phone number', 400);
export const CannotSignAsSystemAdmin = () => new AppError('User Cannot register as system admin', 403);
export const IncorrectCredentials = () => new AppError('Incorrect email or password', 401);
export const InvalidOTPError = () => new AppError('Invalid OTP', 401);
export const InvalidRefreshToken = () => new AppError('Invalid or expired refresh token', 401);