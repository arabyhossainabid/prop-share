import { NextFunction, Request, Response } from 'express';
import { auth } from '../../lib/betterAuth';
import { toNodeHandler } from 'better-auth/node';

/**
 * BetterAuth request handler middleware.
 * Includes improved logging to troubleshoot 404 errors.
 */
export const betterAuthHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Restore the full URL for the internal router
    req.url = req.originalUrl;
    
    // DEBUG: Log the incoming URL to terminal to see what BetterAuth is receiving
    console.log(`[BetterAuth] Handling: ${req.method} ${req.url}`);

    // Process with Node standard handler
    return toNodeHandler(auth.handler)(req, res);
  } catch (error) {
    console.error('BetterAuth Handler Error:', error);
    return next(error);
  }
};
