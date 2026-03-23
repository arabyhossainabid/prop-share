import { Router } from 'express';
import { VoteController } from './vote.controller';
import { checkAuth } from '../../middleware/checkAuth';
import { Role } from '@prisma/client';

const router = Router();

router.post(
    '/:propertyId',
    checkAuth(Role.USER, Role.ADMIN),
    VoteController.vote
);

router.delete(
    '/:propertyId',
    checkAuth(Role.USER, Role.ADMIN),
    VoteController.removeVote
);

router.get('/:propertyId', VoteController.getPropertyVotes);

router.get(
    '/:propertyId/my-vote',
    checkAuth(Role.USER, Role.ADMIN),
    VoteController.getUserVote
);

export const VoteRoutes = router;
