import { Router } from 'express';
import { PropertyController } from './property.controller';
import { checkAuth } from '../../middleware/checkAuth';
import { Role } from '@prisma/client';
import validateRequest from '../../middleware/validateRequest';
import { PropertyValidation } from './property.validation';

const router = Router();

// Public
router.get('/', PropertyController.getAllProperties);
router.get('/:id', PropertyController.getSingleProperty);

// Admin only
router.post(
    '/',
    checkAuth(Role.ADMIN),
    validateRequest(PropertyValidation.create),
    PropertyController.createProperty
);

router.patch(
    '/:id',
    checkAuth(Role.ADMIN),
    validateRequest(PropertyValidation.update),
    PropertyController.updateProperty
);

router.delete(
    '/:id',
    checkAuth(Role.ADMIN),
    PropertyController.deleteProperty
);

export const PropertyRoutes = router;
