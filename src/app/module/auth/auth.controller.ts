import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { AuthService } from './auth.service';
import { envVars } from '../../config/env';

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.registerUser(req.body);
    sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: 'User registered successfully', data: result });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.loginUser(req.body);
    const { accessToken } = result;

    res.cookie('accessToken', accessToken, {
        secure: envVars.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Login successful', data: result });
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
    res.clearCookie('accessToken');
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Logged out successfully' });
});

export const AuthController = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
    logoutUser,
};
