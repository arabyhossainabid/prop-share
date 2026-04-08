import { Role } from '@prisma/client';
import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth';
import { DashboardController } from './dashboard.controller';

const router = Router();

router.get(
  '/user/stats',
  checkAuth(Role.USER, Role.ADMIN),
  DashboardController.getUserStats
);

router.get(
  '/user/charts',
  checkAuth(Role.USER, Role.ADMIN),
  DashboardController.getUserCharts
);

router.get(
  '/admin/charts',
  checkAuth(Role.ADMIN),
  DashboardController.getAdminCharts
);

export const DashboardRoutes = router;
