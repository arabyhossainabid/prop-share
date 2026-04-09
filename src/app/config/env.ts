import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  FRONTEND_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_TRUST_HOST: string;
  SMTP: {
    HOST: string;
    PORT: string;
    SECURE: string;
    USER: string;
    PASS: string;
    FROM: string;
  };
  STRIPE: {
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
  };
  CLOUDINARY: {
    CLOUD_NAME: string;
    API_KEY: string;
    API_SECRET: string;
  };
  OPENROUTER_API_KEY: string;
}

const loadEnvVariables = (): EnvConfig => {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'FRONTEND_URL',
  ];

  requiredEnvVars.forEach((variable) => {
    if (!process.env[variable]) {
      console.warn(`Warning: Environment variable ${variable} is not set.`);
    }
  });

  return {
    NODE_ENV: process.env.NODE_ENV as string,
    PORT: process.env.PORT || '5000',
    DATABASE_URL: process.env.DATABASE_URL as string,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:8080',
    BETTER_AUTH_TRUST_HOST: process.env.BETTER_AUTH_TRUST_HOST || 'true',
    SMTP: {
      HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
      PORT: process.env.SMTP_PORT || '587',
      SECURE: process.env.SMTP_SECURE || 'false',
      USER: process.env.SMTP_USER as string,
      PASS: process.env.SMTP_PASS as string,
      FROM: process.env.SMTP_FROM || `"PropShare" <${process.env.SMTP_USER}>`,
    },
    STRIPE: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
    },
    CLOUDINARY: {
      CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
      API_KEY: process.env.CLOUDINARY_API_KEY as string,
      API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
    },
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY as string,
  };
};

export const envVars = loadEnvVariables();
