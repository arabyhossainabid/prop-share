import { Router } from 'express';
import { AuthController } from './auth.controller';
import { checkAuth } from '../../middleware/checkAuth';
import validateRequest from '../../middleware/validateRequest';
import { AuthValidation } from './auth.validation';
import { Role } from '@prisma/client';

const router = Router();

router.post(
    '/register',
    validateRequest(AuthValidation.register),
    AuthController.registerUser
);

router.post(
    '/login',
    validateRequest(AuthValidation.login),
    AuthController.loginUser
);

router.post('/refresh-token', AuthController.refreshToken);

router.post('/logout', AuthController.logoutUser);

router.get(
    '/me',
    checkAuth(Role.USER, Role.ADMIN),
    AuthController.getMe
);

router.delete(
    '/delete-account',
    checkAuth(Role.USER, Role.ADMIN),
    AuthController.deleteAccount
);

export const AuthRoutes: Router = router;
