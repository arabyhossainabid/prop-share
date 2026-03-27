import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { envVars } from '../config/env';
import { prisma } from './prisma';

/**
 * Better Auth instance configured with Prisma adapter.
 * Supports email/password and OAuth authentication flows.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: envVars.BETTER_AUTH_SECRET,
  baseURL: envVars.BETTER_AUTH_URL,
  basePath: '/api/v1/auth',
  trustedOrigins: [envVars.FRONTEND_URL, envVars.BETTER_AUTH_URL],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
});

export type Session = typeof auth.$Infer.Session;

