import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import passport from './app/lib/passport';
import { envVars } from './app/config/env';
import { globalErrorHandler } from './app/middleware/globalErrorHandler';
import { notFound } from './app/middleware/notFound';
import { IndexRoutes } from './app/routes';
import { InvestmentController } from './app/module/investment/investment.controller';

const app: Express = express();

// CORS
app.use(cors({
    origin: [envVars.FRONTEND_URL, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
}));

// Stripe Webhook - raw body MUST come before express.json()
app.post(
    '/api/v1/investments/webhook',
    express.raw({ type: 'application/json' }),
    InvestmentController.stripeWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Passport
app.use(passport.initialize());

if (envVars.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
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
