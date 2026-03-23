import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { AdminService } from './admin.service';

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getAllUsers(req.query);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Users fetched', data: result });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.updateUserStatus(req.params.userId as string, req.body.isActive);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'User status updated', data: result });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.updateUserRole(req.params.userId as string, req.body.role);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'User role updated', data: result });
});

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getDashboardStats();
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Dashboard stats fetched', data: result });
});

const getAllPropertiesAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getAllPropertiesAdmin(req.query);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Properties fetched', data: result });
});

const getAllInvestmentsAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getAllInvestmentsAdmin(req.query);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Investments fetched', data: result });
});

export const AdminController = {
    getAllUsers,
    updateUserStatus,
    updateUserRole,
    getDashboardStats,
    getAllPropertiesAdmin,
    getAllInvestmentsAdmin,
};
