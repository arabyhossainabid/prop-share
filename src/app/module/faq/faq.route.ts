import { Role } from '@prisma/client';
import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth';
import { FaqController } from './faq.controller';

const router = Router();

router.get('/', FaqController.getAllFaqs);

router.post(
  '/',
  checkAuth(Role.ADMIN),
  FaqController.createFaq
);

export const FaqRoutes = router;
