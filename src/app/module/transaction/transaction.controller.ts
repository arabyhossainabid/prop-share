import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { TransactionService } from './transaction.service';
import { IRequestUser } from '../../interfaces/requestUser.interface';

const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
    const user = req.verifiedUser!;
    const result = await TransactionService.getMyTransactions(user.userId);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Transaction history fetched successfully',
        data: result,
    });
});

export const TransactionController = {
    getMyTransactions
};
