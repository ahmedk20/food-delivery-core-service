import AppError from '../../common/error/AppError'

export const NotAuthenticated = new AppError('User not authenticated', 403);