import AppError from "../../lib/error/AppError";

export const AddressNotFound = () => new AppError('Address not found', 404);
