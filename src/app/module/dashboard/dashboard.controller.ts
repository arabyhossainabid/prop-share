import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { DashboardService } from './dashboard.service';

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.verifiedUser!.userId;
  const result = await DashboardService.getUserStats(userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'User stats retrieved successfully',
    data: result,
  });
});

const getUserCharts = catchAsync(async (req: Request, res: Response) => {
  const userId = req.verifiedUser!.userId;
  const result = await DashboardService.getUserCharts(userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'User chart data retrieved successfully',
    data: result,
  });
});

const getAdminCharts = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getAdminCharts();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Admin chart data retrieved successfully',
    data: result,
  });
});

export const DashboardController = {
  getUserStats,
  getUserCharts,
  getAdminCharts,
};
