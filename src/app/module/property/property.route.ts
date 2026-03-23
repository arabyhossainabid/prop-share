import { Router } from 'express';
import { PropertyController } from './property.controller';
import { checkAuth } from '../../middleware/checkAuth';
import validateRequest from '../../middleware/validateRequest';
import { PropertyValidation } from './property.validation';
import { Role } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', PropertyController.getAllProperties);
router.get('/featured', PropertyController.getFeaturedProperties);
router.get('/:id', PropertyController.getPropertyById);

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

export const PropertyRoutes = router;
