import { Router } from 'express';
import { MarketplaceController } from './marketplace.controller';
import { checkAuth } from '../../middleware/checkAuth';
import { Role } from '@prisma/client';
import validateRequest from '../../middleware/validateRequest';
import { MarketplaceValidation } from './marketplace.validation';

const router = Router();

router.get('/', MarketplaceController.getAllListings);

router.post(
    '/list',
    checkAuth(Role.USER, Role.ADMIN),
    validateRequest(MarketplaceValidation.listShares),
    MarketplaceController.listShares
);

router.post(
    '/buy/:id',
    checkAuth(Role.USER, Role.ADMIN),
    MarketplaceController.buyShares
);

export const MarketplaceRoutes = router;
