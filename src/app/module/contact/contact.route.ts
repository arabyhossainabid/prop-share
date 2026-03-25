import { Router } from 'express';
import { ContactController } from './contact.controller';
import validateRequest from '../../middleware/validateRequest';
import { ContactValidation } from './contact.validation';
import { checkAuth } from '../../middleware/checkAuth';
import { Role } from '@prisma/client';

const router = Router();

router.post(
    '/',
    validateRequest(ContactValidation.createContactSchema),
    ContactController.submitMessage
);

router.get(
    '/',
    checkAuth(Role.ADMIN),
    ContactController.getAllMessages
);

router.delete(
    '/:id',
    checkAuth(Role.ADMIN),
    ContactController.deleteMessage
);

export const ContactRoutes: Router = router;
