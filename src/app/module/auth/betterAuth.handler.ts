import { Request, Response, NextFunction } from 'express';
import { auth } from '../../lib/betterAuth';

/**
 * BetterAuth request handler middleware.
 * Processes all BetterAuth routes and callbacks.
 * Routes include:
 * - POST /api/v1/auth/sign-up
 * - POST /api/v1/auth/sign-in
 * - POST /api/v1/auth/sign-out
 * - POST /api/v1/auth/change-password
 * - GET /api/v1/auth/session
 * - GET /api/v1/auth/callback/:provider
 */
export const betterAuthHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Let BetterAuth handle the request
    const response = await auth.handler(req as any);
    
    if (response) {
      res.status(response.status || 200);
      Object.entries(response.headers || {}).forEach(([key, value]) => {
        res.setHeader(key, value as string);
      });
      res.send(response.body);
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
};

