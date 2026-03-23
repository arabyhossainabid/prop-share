import { Router } from 'express';
import { InvestmentController } from './investment.controller';
import { checkAuth } from '../../middleware/checkAuth';
import { Role } from '@prisma/client';

const router = Router();

router.post(
    '/checkout/:propertyId',
    checkAuth(Role.USER, Role.ADMIN),
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

// Note: Webhook is usually called directly in app.ts to avoid express.json() interference
router.post('/webhook', InvestmentController.stripeWebhook);

export const InvestmentRoutes = router;
