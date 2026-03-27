import { Role } from '@prisma/client';
import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth';
import validateRequest from '../../middleware/validateRequest';
import { InvestmentController } from './investment.controller';
import { InvestmentValidation } from './investment.validation';

const router = Router();

router.post(
  '/checkout/:propertyId',
  checkAuth(Role.USER, Role.ADMIN),
  validateRequest(InvestmentValidation.createCheckoutSessionSchema),
  InvestmentController.createCheckoutSession
);

router.get(
  '/my-investments',
  checkAuth(Role.USER, Role.ADMIN),
  InvestmentController.getMyInvestments
);

router.get(
  '/check/:propertyId',
  checkAuth(Role.USER, Role.ADMIN),
  InvestmentController.checkHasInvestment
);

router.get(
  '/session/:sessionId',
  checkAuth(Role.USER, Role.ADMIN),
  validateRequest(InvestmentValidation.getCheckoutSessionSchema),
  InvestmentController.getCheckoutSessionDetails
);

router.get(
  '/payment-failure/:transactionId',
  InvestmentController.getPaymentFailureReason
);

// Note: Webhook is usually called directly in app.ts to avoid express.json() interference
router.post('/webhook', InvestmentController.stripeWebhook);

export const InvestmentRoutes: Router = router;
