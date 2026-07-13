import AppError from "../../lib/error/AppError";

export const MediaNotFoundError = new AppError('Media not found', 404);
