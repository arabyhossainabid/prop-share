import { Router } from 'express';
import { AuthRoutes } from '../module/auth/auth.route';
import { PropertyRoutes } from '../module/property/property.route';
import { InvestmentRoutes } from '../module/investment/investment.route';
import { MarketplaceRoutes } from '../module/marketplace/marketplace.route';
import { AdminRoutes } from '../module/admin/admin.route';
import { ReviewRoutes } from '../module/review/review.route';
import { TransactionRoutes } from '../module/transaction/transaction.route';

const router = Router();

const moduleRoutes = [
    { path: '/auth', route: AuthRoutes },
    { path: '/properties', route: PropertyRoutes },
    { path: '/investments', route: InvestmentRoutes },
    { path: '/marketplace', route: MarketplaceRoutes },
    { path: '/reviews', route: ReviewRoutes },
    { path: '/transactions', route: TransactionRoutes },
    { path: '/admin', route: AdminRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export const IndexRoutes = router;
