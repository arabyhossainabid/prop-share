import { Router } from 'express';
import { BlogController } from './blog.controller';

const router = Router();

// Public routes
router.get('/', BlogController.getAllBlogs);
router.get('/featured', BlogController.getFeaturedBlogs);

export const BlogRoutes: Router = router;
