import type { Router } from 'express';
import { toHandler } from 'better-auth/express';
import { auth } from '../../lib/betterAuth';

/**
 * BetterAuth routes handler for Express.
 * This exports a middleware that handles all BetterAuth auth endpoints.
 * Routes include:
 * - POST /api/v1/auth/sign-up
 * - POST /api/v1/auth/sign-in
 * - POST /api/v1/auth/sign-out
 * - POST /api/v1/auth/change-password
 * - GET /api/v1/auth/session
 * - GET /api/v1/auth/callback/:provider
 */
export const betterAuthHandler = toHandler(auth);
