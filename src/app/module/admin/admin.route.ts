import { Router } from 'express';
import { AdminController } from './admin.controller';
import { checkAuth } from '../../middleware/checkAuth';
import { Role } from '@prisma/client';

const router = Router();

router.get(
    '/users',
    checkAuth(Role.ADMIN),
    AdminController.getAllUsers
);

router.patch(
    '/users/:userId/status',
    checkAuth(Role.ADMIN),
    AdminController.updateUserStatus
);

router.patch(
    '/users/:userId/role',
    checkAuth(Role.ADMIN),
    AdminController.updateUserRole
);

router.get(
    '/stats',
    checkAuth(Role.ADMIN),
    AdminController.getDashboardStats
);

router.get(
    '/properties',
    checkAuth(Role.ADMIN),
    AdminController.getAllPropertiesAdmin
);

router.get(
    '/investments',
    checkAuth(Role.ADMIN),
    AdminController.getAllInvestmentsAdmin
);

export const AdminRoutes = router;
