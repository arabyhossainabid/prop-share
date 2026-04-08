import { NextFunction, Request, Response } from 'express';
import { auth } from '../../lib/betterAuth';

/**
 * BetterAuth request handler middleware.
 * Optimized to handle BetterAuth routes and pass-through others to Express routers.
 */
export const betterAuthHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure req.url is the full path for BetterAuth's internal router
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    const request = new Request(fullUrl, {
      method: req.method,
      headers: req.headers as any,
      body: ['POST', 'PUT', 'PATCH'].includes(req.method)
        ? JSON.stringify(req.body)
        : undefined,
    });

    // Check if BetterAuth should handle this request
    const response = await auth.handler(request);

    if (response) {
      // If the response is a 404, it might mean BetterAuth doesn't handle this route
      // However, we should check the body/status more carefully
      if (response.status === 404) {
        return next();
      }

      // Apply BetterAuth status and headers
      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      // Send the body
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const body = await response.json();
        return res.json(body);
      } else {
        const body = await response.text();
        return res.send(body);
      }
    } else {
      // No response from BetterAuth, move to next middleware
      return next();
    }
  } catch (error) {
    // Log error but try to continue to other routes if possible
    console.error('[BetterAuth Handler Error]:', error);
    next();
  }
};
