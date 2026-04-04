import AppError from "../../common/error/AppError";

export const AddressNotFound = () => new AppError('Address not found', 404);
