import { Router } from 'express';
import { TransactionController } from './transaction.controller';
import { checkAuth } from '../../middleware/checkAuth';
import { Role } from '@prisma/client';

const router = Router();

router.get(
    '/me',
    checkAuth(Role.USER, Role.ADMIN),
    TransactionController.getMyTransactions
);

export const TransactionRoutes = router;
