import { Role } from '@prisma/client';
import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth';
import { CommentController } from './comment.controller';

const router = Router();

router.post(
  '/:propertyId',
  checkAuth(Role.USER, Role.ADMIN),
  CommentController.addComment
);

router.get('/:propertyId', CommentController.getPropertyComments);

export const CommentRoutes: Router = router;
