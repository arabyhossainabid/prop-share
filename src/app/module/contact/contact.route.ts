import { Role } from '@prisma/client';
import { Router } from 'express';
import { checkAuth, checkAuthOptional } from '../../middleware/checkAuth';
import validateRequest from '../../middleware/validateRequest';
import { ContactController } from './contact.controller';
import { ContactValidation } from './contact.validation';

const router = Router();

router.post(
  '/',
  checkAuthOptional(),
  validateRequest(ContactValidation.createContactSchema),
  ContactController.submitMessage
);

router.post(
  '/submit',
  checkAuthOptional(),
  validateRequest(ContactValidation.createContactSchema),
  ContactController.submitMessage
);

router.get('/', checkAuth(Role.ADMIN), ContactController.getAllMessages);

router.delete('/:id', checkAuth(Role.ADMIN), ContactController.deleteMessage);

router.get(
  '/my-messages',
  checkAuth(Role.USER),
  ContactController.getMyMessages
);

router.get(
  '/:contactId/replies',
  checkAuth(Role.USER, Role.ADMIN),
  ContactController.getReplies
);

export const ContactRoutes: Router = router;
