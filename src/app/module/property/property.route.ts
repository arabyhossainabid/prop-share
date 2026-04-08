import { Role } from '@prisma/client';
import { Router } from 'express';
import { checkAuth, checkAuthOptional } from '../../middleware/checkAuth';
import validateRequest from '../../middleware/validateRequest';
import { PropertyController } from './property.controller';
import { PropertyValidation } from './property.validation';

const router = Router();

// Public routes
router.get('/summary', PropertyController.getPublicSummary);
router.get('/categories', PropertyController.getCategories);
router.get('/search', PropertyController.getAllProperties);
router.get('/', PropertyController.getAllProperties);
router.get('/featured', PropertyController.getFeaturedProperties);

router.get('/:id/reviews', PropertyController.getPropertyReviews);

// Member routes
router.post(
  '/',
  checkAuth(Role.USER, Role.ADMIN),
  validateRequest(PropertyValidation.createPropertySchema),
  PropertyController.createProperty
);

router.get(
  '/my-properties',
  checkAuth(Role.USER, Role.ADMIN),
  PropertyController.getMyProperties
);

router.get(
  '/my-properties/stats',
  checkAuth(Role.USER, Role.ADMIN),
  PropertyController.getMyPropertiesStats
);

router.get('/:id', checkAuthOptional(), PropertyController.getPropertyById);

router.patch(
  '/:id',
  checkAuth(Role.USER, Role.ADMIN),
  validateRequest(PropertyValidation.updatePropertySchema),
  PropertyController.updateProperty
);

router.post(
  '/:id/submit',
  checkAuth(Role.USER, Role.ADMIN),
  PropertyController.submitForReview
);

router.delete(
  '/:id',
  checkAuth(Role.USER, Role.ADMIN),
  PropertyController.deleteProperty
);

// Admin routes
router.patch(
  '/:id/review',
  checkAuth(Role.ADMIN),
  validateRequest(PropertyValidation.reviewPropertySchema),
  PropertyController.reviewProperty
);

router.patch(
  '/:id/toggle-featured',
  checkAuth(Role.ADMIN),
  PropertyController.toggleFeatured
);

export const PropertyRoutes: Router = router;
