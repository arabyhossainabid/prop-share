import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import { envVars } from '../config/env';
import AppError from '../errorHelpers/AppError';
import { IRequestUser } from '../interfaces/requestUser.interface';
import { auth } from '../lib/betterAuth';
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

/**
 * Enhanced auth middleware that supports:
 * 1. Standard JWT (from Cookie or Header)
 * 2. BetterAuth Sessions (from Cookie or Header)
 */
export const checkAuth =
  (...authRoles: Role[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        let user: IRequestUser | null = null;

        // --- 1. Try Standard JWT ---
        const accessToken = extractAccessToken(req);
        if (accessToken) {
          const verifiedToken = jwtUtils.verifyToken(
            accessToken,
            envVars.JWT_ACCESS_SECRET
          );

          if (verifiedToken.success && verifiedToken.data) {
            user = verifiedToken.data as IRequestUser;
          }
        }

        // --- 2. Try BetterAuth Session (Fallback/Alternative) ---
        if (!user) {
          const session = await auth.api.getSession({
            headers: req.headers as any,
          });

          if (session?.user) {
            user = {
              userId: session.user.id,
              email: session.user.email,
              role: (session.user as any).role || 'USER',
              name: session.user.name || '',
            };
          }
        }

        if (!user) {
          throw new AppError(
            status.UNAUTHORIZED,
            'Unauthorized access! Please login.'
          );
        }

        // --- 3. Enforce Role Guard ---
        if (authRoles.length > 0 && !authRoles.includes(user.role)) {
          throw new AppError(
            status.FORBIDDEN,
            'Forbidden access! You do not have permission.'
          );
        }

        // Store authenticated user context (unify on req.verifiedUser)
        req.verifiedUser = user;
        // Also attach to req.user for BetterAuth compatibility if needed
        (req as any).user = user;

        next();
      } catch (error: any) {
        next(error);
      }
    };

export const checkAuthOptional =
  () => async (req: Request, res: Response, next: NextFunction) => {
    try {
      let user: IRequestUser | null = null;

      // Try JWT
      const accessToken = extractAccessToken(req);
      if (accessToken) {
        const verifiedToken = jwtUtils.verifyToken(
          accessToken,
          envVars.JWT_ACCESS_SECRET
        );
        if (verifiedToken.success && verifiedToken.data) {
          user = verifiedToken.data as IRequestUser;
        }
      }

      // Try BetterAuth
      if (!user) {
        const session = await auth.api.getSession({
          headers: req.headers as any,
        });
        if (session?.user) {
          user = {
            userId: session.user.id,
            email: session.user.email,
            role: (session.user as any).role || 'USER',
            name: session.user.name || '',
          };
        }
      }

      if (user) {
        req.verifiedUser = user;
        (req as any).user = user;
      }

      next();
    } catch {
      next();
    }
  };

