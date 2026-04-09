import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { sendPasswordResetEmail } from '../utils/email';
import { prisma } from './prisma';

/**
 * BetterAuth instance — handles Google OAuth, sessions, and sign-in/email flows.
 * Custom email/password routes (register, login) are handled separately by AuthService.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  secret: process.env.BETTER_AUTH_SECRET || 'secret',

  // The exact backend URL (e.g. http://localhost:8080)
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:8080',

  // The mount path exactly as it will be in Express
  basePath: '/api/v1/auth',

  trustedOrigins: [
    process.env.FRONTEND_URL as string,
    'http://localhost:3000',
    'http://localhost:3001',
  ],

  emailAndPassword: {
    enabled: true,
    // Called by BetterAuth's built-in /forget-password endpoint
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url, user.name || undefined);
    },
  },

  user: {
    // Map BetterAuth's internal `image` field to the `avatar` column in the DB.
    // Do NOT remap `role` here — BetterAuth has no built-in role field;
    // the Prisma schema default (@default(USER)) handles it automatically.
    fields: {
      image: 'avatar',
    },
  },
});

export type Session = typeof auth.$Infer.Session;
