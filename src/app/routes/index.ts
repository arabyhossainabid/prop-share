import { Router } from 'express';
import { AuthRoutes } from '../module/auth/auth.route';
import { CategoryRoutes } from '../module/category/category.route';
import { PropertyRoutes } from '../module/property/property.route';
import { VoteRoutes } from '../module/vote/vote.route';
import { CommentRoutes } from '../module/comment/comment.route';
import { InvestmentRoutes } from '../module/investment/investment.route';
import { AdminRoutes } from '../module/admin/admin.route';

const router = Router();

const moduleRoutes = [
    { path: '/auth', route: AuthRoutes },
    { path: '/categories', route: CategoryRoutes },
    { path: '/properties', route: PropertyRoutes },
    { path: '/votes', route: VoteRoutes },
    { path: '/comments', route: CommentRoutes },
    { path: '/investments', route: InvestmentRoutes },
    { path: '/admin', route: AdminRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export const IndexRoutes = router;
