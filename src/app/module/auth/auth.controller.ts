import { Request, Response } from 'express';
import status from 'http-status';
import { envVars } from '../../config/env';
import AppError from '../../errorHelpers/AppError';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { AuthService } from './auth.service';

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);
  const { accessToken, refreshToken, user } = result;

  res.cookie('refreshToken', refreshToken, {
    secure: envVars.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: envVars.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Login successful',
    data: { accessToken, user },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  // Priority: Cookie > Authorization Header > Request Body
  let token = req.cookies.refreshToken;

  // Try Authorization header if cookie not found
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization.trim();
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else {
      token = authHeader;
    }
  }

  // Try request body if still not found
  if (!token && req.body.refreshToken) {
    token = req.body.refreshToken;
  }

  if (!token) {
    throw new AppError(status.UNAUTHORIZED, 'No refresh token provided');
  }

  const result = await AuthService.refreshToken(token);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Access token generated successfully',
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.getMe(req.verifiedUser!.userId);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Profile fetched',
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.updateProfile(
    req.verifiedUser!.userId,
    req.body
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Profile updated',
    data: result,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
  // Clear BetterAuth session cookie (standard name)
  res.clearCookie('better-auth.session_token');

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Logged out successfully',
  });
});

const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.deleteAccount(req.verifiedUser!.userId);
  res.clearCookie('refreshToken');
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Account deleted successfully',
    data: result,
  });
});

const socialLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.socialLogin(req.body);
  const { accessToken, refreshToken, user, isNewUser } = result;

  res.cookie('refreshToken', refreshToken, {
    secure: envVars.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: envVars.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: isNewUser
      ? 'Account created and login successful'
      : 'Login successful',
    data: { accessToken, user },
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.forgotPassword(req.body.email);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: result.message,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const result = await AuthService.resetPassword(token, newPassword);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: result.message,
  });
});

export const AuthController = {
  registerUser,
  loginUser,
  refreshToken,
  getMe,
  updateProfile,
  logoutUser,
  deleteAccount,
  socialLogin,
  forgotPassword,
  resetPassword,
};
