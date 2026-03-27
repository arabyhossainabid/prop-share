import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { emailAndPassword, emailVerification, magicLink } from 'better-auth/plugins';
import { envVars } from '../config/env';
import { prisma } from './prisma';

/**
 * Better Auth instance configured with Prisma adapter and authentication plugins.
 * Supports email/password and OAuth authentication flows.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql', // Use the database provider based on you database
  }),
  secret: envVars.BETTER_AUTH_SECRET,
  baseURL: envVars.BETTER_AUTH_URL,
  basePath: '/api/v1/auth',
  trustedOrigins: [envVars.FRONTEND_URL, envVars.BETTER_AUTH_URL],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectURL: `${envVars.BETTER_AUTH_URL}/api/v1/auth/callback/google`,
    },
  },
  plugins: [
    emailAndPassword({
      enabled: true,
      autoSignUpEmail: false,
      requireEmailVerification: false,
    }),
    emailVerification({
      async sendVerificationEmail({ user, url, token }) {
        // TODO: Implement email sending logic here
        console.log(`Email verification URL for ${user.email}: ${url}`);
      },
    }),
  ],
  user: {
    fields: {
      phone: {
        type: 'string',
        required: false,
        validate: (phone: string) => {
          // Optional: Add phone validation logic
          return phone.length >= 10;
        },
        input: false,
      },
      bio: {
        type: 'string',
        required: false,
        input: false,
      },
      avatar: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
