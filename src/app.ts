import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import { envVars } from './app/config/env';
import { globalErrorHandler } from './app/middleware/globalErrorHandler';
import { notFound } from './app/middleware/notFound';
import { InvestmentController } from './app/module/investment/investment.controller';
import { IndexRoutes } from './app/routes';
import { betterAuthHandler } from './app/module/auth/betterAuth.handler';

const app: Express = express();

// CORS
app.use(
  cors({
    origin: [
      envVars.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://propsphere.vercel.app',
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

// Routes
app.use('/api/v1/auth', betterAuthHandler);
app.use('/api/v1', IndexRoutes);

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
