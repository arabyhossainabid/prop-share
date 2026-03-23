import { Router } from 'express';
import { CommentController } from './comment.controller';
import { checkAuth } from '../../middleware/checkAuth';
import { Role } from '@prisma/client';

const router = Router();

router.post(
    '/:propertyId',
    checkAuth(Role.USER, Role.ADMIN),
    CommentController.addComment
);

router.get('/:propertyId', CommentController.getPropertyComments);

router.patch(
    '/:commentId',
    checkAuth(Role.USER, Role.ADMIN),
    CommentController.updateComment
);

router.delete(
    '/:commentId',
    checkAuth(Role.USER, Role.ADMIN),
    CommentController.deleteComment
);

export const CommentRoutes = router;
