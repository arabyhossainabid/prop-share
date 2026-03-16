import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { InvestmentService } from './investment.service';
import { IRequestUser } from '../../interfaces/requestUser.interface';

const purchaseShares = catchAsync(async (req: Request, res: Response) => {
    const user = req.verifiedUser!;
    const result = await InvestmentService.purchaseShares(user.userId, req.body);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Checkout session created successfully',
        data: result,
    });
});

const getMyInvestments = catchAsync(async (req: Request, res: Response) => {
    const user = req.verifiedUser!;
    const result = await InvestmentService.getMyInvestments(user.userId);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Investments fetched successfully',
        data: result,
    });
});

export const InvestmentController = {
    purchaseShares,
    getMyInvestments
};
