import { Router } from 'express';
import { CategoryController } from './category.controller';
import { CategoryValidation } from './category.validation';
import { checkAuth } from '../../middleware/checkAuth';
import validateRequest from '../../middleware/validateRequest';
import { Role } from '@prisma/client';

const router = Router();

// Public
router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getCategoryById);

// Admin only
router.post('/', checkAuth(Role.ADMIN), validateRequest(CategoryValidation.create), CategoryController.createCategory);
router.patch('/:id', checkAuth(Role.ADMIN), validateRequest(CategoryValidation.update), CategoryController.updateCategory);
router.delete('/:id', checkAuth(Role.ADMIN), CategoryController.deleteCategory);

export const CategoryRoutes = router;
