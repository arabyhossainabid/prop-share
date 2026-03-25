import { Role } from '@prisma/client';
import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth';
import validateRequest from '../../middleware/validateRequest';
import { AdminController } from './admin.controller';
import { AdminValidation } from './admin.validation';

const router = Router();

router.get('/users', checkAuth(Role.ADMIN), AdminController.getAllUsers);

router.patch(
  '/users/:userId/status',
  checkAuth(Role.ADMIN),
  validateRequest(AdminValidation.updateUserStatusSchema),
  AdminController.updateUserStatus
);

router.patch(
  '/users/:userId/role',
  checkAuth(Role.ADMIN),
  validateRequest(AdminValidation.updateUserRoleSchema),
  AdminController.updateUserRole
);

router.delete(
  '/users/:userId',
  checkAuth(Role.ADMIN),
  AdminController.deleteUser
);

router.get('/stats', checkAuth(Role.ADMIN), AdminController.getDashboardStats);

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

router.post(
  '/categories',
  checkAuth(Role.ADMIN),
  validateRequest(AdminValidation.createCategorySchema),
  AdminController.createCategory
);

router.patch(
  '/categories/:categoryId',
  checkAuth(Role.ADMIN),
  validateRequest(AdminValidation.updateCategorySchema),
  AdminController.updateCategory
);

router.delete(
  '/categories/:categoryId',
  checkAuth(Role.ADMIN),
  AdminController.deleteCategory
);

router.patch(
  '/properties/:propertyId/featured',
  checkAuth(Role.ADMIN),
  validateRequest(AdminValidation.updatePropertyFeaturedSchema),
  AdminController.updatePropertyFeatured
);

export const AdminRoutes: Router = router;
