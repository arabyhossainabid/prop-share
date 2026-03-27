import { Role } from '@prisma/client';
import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth';
import validateRequest from '../../middleware/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import { betterAuthHandler } from './betterAuth.handler';

const router = Router();

// BetterAuth routes (handles all OAuth, email verification, etc.)
router.use(betterAuthHandler);

// Legacy/backward-compatible routes that may be deprecated
// These are maintained for existing frontend integrations

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

router.patch(
  '/update-profile',
  checkAuth(Role.USER, Role.ADMIN),
  validateRequest(AuthValidation.updateProfile),
  AuthController.updateProfile
);

router.get('/me', checkAuth(Role.USER, Role.ADMIN), AuthController.getMe);

router.delete(
  '/delete-account',
  checkAuth(Role.USER, Role.ADMIN),
  AuthController.deleteAccount
);

export const AuthRoutes: Router = router;
