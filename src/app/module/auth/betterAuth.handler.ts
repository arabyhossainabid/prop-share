import { toNodeHandler } from 'better-auth/node';
import { auth } from '../../lib/betterAuth';

/**
 * Clean, standard request handler for BetterAuth
 */
export const betterAuthHandler = toNodeHandler(auth.handler);
