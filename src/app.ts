import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import { envVars } from './app/config/env';
import { globalErrorHandler } from './app/middleware/globalErrorHandler';
import { notFound } from './app/middleware/notFound';
import { betterAuthHandler } from './app/module/auth/betterAuth.handler';
import { InvestmentController } from './app/module/investment/investment.controller';
import { IndexRoutes } from './app/routes';

const app: Express = express();

// CORS
app.use(
  cors({
    origin: [
      envVars.FRONTEND_URL,
      'https://propsphere.vercel.app',
      /^https:\/\/propshare-.*\.vercel\.app$/, // Allow Vercel preview deployments
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  })
);

// Stripe Webhook - raw body MUST come before express.json()
app.post(
  '/api/v1/investments/webhook',
  express.raw({ type: 'application/json' }),
  InvestmentController.stripeWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (envVars.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ==========================================
// ROUTES (Strict Priority Order)
// ==========================================

// ✅ FIRST: Custom app routes (register, login, me, etc.)
// Custom /auth/* routes must run before BetterAuth so they are not swallowed.
app.use('/api/v1', IndexRoutes);

// ✅ SECOND: BetterAuth handles OAuth callbacks, sessions, sign-in/email, etc.
// Any /api/v1/auth/* path NOT handled by custom routes falls through to here.
app.all('/api/v1/auth/*', (req, res) => {
  return betterAuthHandler(req, res);
});

// ==========================================

// Health check
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'PropShare API is running',
    version: '1.0.0',
    docs: '/api/v1',
  });
});

// Error Handling
app.use(notFound);
app.use(globalErrorHandler);

export default app;
