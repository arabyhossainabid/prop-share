import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import { envVars } from '../config/env';
import AppError from '../errorHelpers/AppError';
import { IRequestUser } from '../interfaces/requestUser.interface';
import { CookieUtils } from '../utils/cookie';
import { jwtUtils } from '../utils/jwt';

// Supports both cookie-based auth and Authorization header for API clients.
const extractAccessToken = (req: Request): string | undefined => {
  let accessToken = CookieUtils.getCookie(req, 'accessToken');

  if (!accessToken && req.headers.authorization) {
    const authHeader = req.headers.authorization.trim();
    const [scheme, token] = authHeader.split(/\s+/);
    accessToken =
      scheme?.toLowerCase() === 'bearer' && token ? token : authHeader;
  }

  return accessToken;
};

export const checkAuth =
  (...authRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Require a valid access token for protected routes.
      const accessToken = extractAccessToken(req);

      if (!accessToken) {
        throw new AppError(
          status.UNAUTHORIZED,
          'Unauthorized access! No access token provided.'
        );
      }

      const verifiedToken = jwtUtils.verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET
      );

      if (!verifiedToken.success || !verifiedToken.data) {
        throw new AppError(
          status.UNAUTHORIZED,
          'Unauthorized access! Invalid or expired access token.'
        );
      }

      const user = verifiedToken.data as IRequestUser;

      // Enforce role guard only when roles are provided to middleware.
      if (authRoles.length > 0 && !authRoles.includes(user.role)) {
        throw new AppError(
          status.FORBIDDEN,
          'Forbidden access! You do not have permission to access this resource.'
        );
      }

      // Store authenticated user context for downstream handlers.
      req.verifiedUser = user;

      next();
    } catch (error: any) {
      next(error);
    }
  };

export const checkAuthOptional =
  () => async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Public routes can continue without credentials.
      const accessToken = extractAccessToken(req);

      if (!accessToken) {
        return next();
      }

      const verifiedToken = jwtUtils.verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET
      );

      // Attach user context only when the token is valid.
      if (verifiedToken.success && verifiedToken.data) {
        req.verifiedUser = verifiedToken.data as IRequestUser;
      }

      next();
    } catch {
      // Public route: ignore token parse issues and continue as anonymous.
      next();
    }
  };
