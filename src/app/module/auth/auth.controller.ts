import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { AuthService } from './auth.service';
import { envVars } from '../../config/env';
import AppError from '../../errorHelpers/AppError';

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.registerUser(req.body);
    sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: 'User registered successfully', data: result });
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
    // Priority: Cookie first, then header (if passed specifically)
    const token = req.cookies.refreshToken || req.headers.authorization;

    if (!token) {
        throw new AppError(status.UNAUTHORIZED, 'No refresh token provided.');
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
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Profile fetched', data: result });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.updateProfile(req.verifiedUser!.userId, req.body);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Profile updated', data: result });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
    res.clearCookie('refreshToken');
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Logged out successfully' });
});

const deleteAccount = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.deleteAccount(req.verifiedUser!.userId);
    res.clearCookie('refreshToken');
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Account deleted successfully', data: result });
});

export const AuthController = {
    registerUser,
    loginUser,
    refreshToken,
    getMe,
    updateProfile,
    logoutUser,
    deleteAccount,
};
