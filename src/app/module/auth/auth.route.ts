import { Role } from '@prisma/client';
import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth';
import validateRequest from '../../middleware/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = Router();

// 1. Social Login (Legacy endpoint — frontend sends Google token payload directly)
router.post('/social-login', AuthController.socialLogin);

// 1b. Google Sign-In — frontend sends Google ID token (credential), backend verifies & issues JWT
router.post('/google/callback', AuthController.googleLogin);

// 2. Register
router.post(
  '/register',
  validateRequest(AuthValidation.register),
  AuthController.registerUser
);

// 3. Login
router.post(
  '/login',
  validateRequest(AuthValidation.login),
  AuthController.loginUser
);

// 4. Refresh token
router.post('/refresh-token', AuthController.refreshToken);

// 5. Logout
router.post('/logout', AuthController.logoutUser);

// 6. Forgot password — sends reset email
router.post(
  '/forgot-password',
  validateRequest(AuthValidation.forgotPassword),
  AuthController.forgotPassword
);

// 7. Reset password — verifies token and sets new password
router.post(
  '/reset-password',
  validateRequest(AuthValidation.resetPassword),
  AuthController.resetPassword
);

// 8. Get current user
router.get('/me', checkAuth(Role.USER, Role.ADMIN), AuthController.getMe);

// 9. Update profile
router.patch(
  '/update-profile',
  checkAuth(Role.USER, Role.ADMIN),
  validateRequest(AuthValidation.updateProfile),
  AuthController.updateProfile
);

router.patch(
  '/profile/update',
  checkAuth(Role.USER, Role.ADMIN),
  validateRequest(AuthValidation.updateProfile),
  AuthController.updateProfile
);

// 10. Delete account
router.delete(
  '/delete-account',
  checkAuth(Role.USER, Role.ADMIN),
  AuthController.deleteAccount
);

export const AuthRoutes: Router = router;
