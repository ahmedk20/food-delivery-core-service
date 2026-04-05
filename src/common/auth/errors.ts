import AppError from '../../common/error/AppError'

export const NotAuthenticated = new AppError('User not authenticated', 403);
export const UnAuthorisedError = new AppError('User not authorised', 403);
