import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import { auth } from '../lib/betterAuth';
import AppError from '../errorHelpers/AppError';

/**
 * BetterAuth session middleware.
 * Validates BetterAuth session token and attaches user to request.
 * Can be used with or without required authentication.
 */
export const checkBetterAuthSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get authentication header
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return next();
    }

    // Verify session using BetterAuth
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (session?.user) {
      (req as any).user = session.user;
      (req as any).session = session.session;
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Required BetterAuth session middleware.
 * Returns 401 if session is not valid or missing.
 */
export const requireBetterAuthSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session?.user) {
      throw new AppError(
        status.UNAUTHORIZED,
        'Unauthorized access! No valid session found.'
      );
    }

    (req as any).user = session.user;
    (req as any).session = session.session;

    next();
  } catch (error: any) {
    next(
      error instanceof AppError
        ? error
        : new AppError(status.UNAUTHORIZED, 'Invalid session')
    );
  }
};
