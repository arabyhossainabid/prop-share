import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { MarketplaceService } from './marketplace.service';
import { IRequestUser } from '../../interfaces/requestUser.interface';

const listShares = catchAsync(async (req: Request, res: Response) => {
    const user = req.verifiedUser!;
    const result = await MarketplaceService.listSharesForSale(user.userId, req.body);
    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: 'Shares listed on marketplace',
        data: result,
    });
});

const buyShares = catchAsync(async (req: Request, res: Response) => {
    const user = req.verifiedUser!;
    const listingId = req.params.id as string;
    const result = await MarketplaceService.buyFromMarket(user.userId, listingId);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Shares purchased successfully from marketplace',
        data: result,
    });
});

const getAllListings = catchAsync(async (req: Request, res: Response) => {
    const result = await MarketplaceService.getAllListings();
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Secondary market listings fetched',
        data: result,
    });
});

export const MarketplaceController = {
    listShares,
    buyShares,
    getAllListings
};
