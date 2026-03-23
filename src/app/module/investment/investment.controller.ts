import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { InvestmentService } from './investment.service';
import { stripe } from '../../lib/stripe';
import { envVars } from '../../config/env';

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
    const { shares } = req.body;
    const result = await InvestmentService.createCheckoutSession(req.verifiedUser!.userId, req.params.propertyId as string, shares);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Checkout session created', data: result });
});

const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, envVars.STRIPE.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    await InvestmentService.handleWebhook(event);
    res.json({ received: true });
});

const getMyInvestments = catchAsync(async (req: Request, res: Response) => {
    const result = await InvestmentService.getUserInvestments(req.verifiedUser!.userId);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Investments fetched', data: result });
});

const checkHasInvestment = catchAsync(async (req: Request, res: Response) => {
    const result = await InvestmentService.hasInvestment(req.verifiedUser!.userId, req.params.propertyId as string);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Investment status checked', data: result });
});

export const InvestmentController = {
    createCheckoutSession,
    stripeWebhook,
    getMyInvestments,
    checkHasInvestment,
};
