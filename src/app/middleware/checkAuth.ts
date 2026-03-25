import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import { Role } from '@prisma/client';
import { envVars } from '../config/env';
import AppError from '../errorHelpers/AppError';
import { CookieUtils } from '../utils/cookie';
import { jwtUtils } from '../utils/jwt';
import { IRequestUser } from '../interfaces/requestUser.interface';

export const checkAuth = (...authRoles: Role[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        let accessToken = CookieUtils.getCookie(req, 'accessToken');

        // Check if token exists in headers if not in cookie
        if (!accessToken && req.headers.authorization) {
            accessToken = req.headers.authorization.split(' ')[1];
        }

        if (!accessToken) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! No access token provided.');
        }

        const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.JWT_ACCESS_SECRET);

        if (!verifiedToken.success || !verifiedToken.data) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! Invalid or expired access token.');
        }

        const user = verifiedToken.data as IRequestUser;

        if (authRoles.length > 0 && !authRoles.includes(user.role)) {
            throw new AppError(status.FORBIDDEN, 'Forbidden access! You do not have permission to access this resource.');
        }

        // Add user to request object
        req.verifiedUser = user;

        next();
    } catch (error: any) {
        next(error);
    }
};
