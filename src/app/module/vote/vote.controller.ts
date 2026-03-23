import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { VoteService } from './vote.service';
import { VoteType } from '@prisma/client';

const vote = catchAsync(async (req: Request, res: Response) => {
    const { propertyId } = req.params;
    const { voteType } = req.body;

    if (!Object.values(VoteType).includes(voteType)) {
        sendResponse(res, { httpStatusCode: status.BAD_REQUEST, success: false, message: 'voteType must be UPVOTE or DOWNVOTE' });
        return;
    }

    const result = await VoteService.vote(req.verifiedUser!.userId, propertyId as string, voteType);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: result.message, data: result.data });
});

const removeVote = catchAsync(async (req: Request, res: Response) => {
    const result = await VoteService.removeVote(req.verifiedUser!.userId, req.params.propertyId as string);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: result.message });
});

const getPropertyVotes = catchAsync(async (req: Request, res: Response) => {
    const result = await VoteService.getPropertyVotes(req.params.propertyId as string);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Vote counts fetched', data: result });
});

const getUserVote = catchAsync(async (req: Request, res: Response) => {
    const result = await VoteService.getUserVoteOnProperty(req.verifiedUser!.userId, req.params.propertyId as string);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'User vote fetched', data: result });
});

export const VoteController = {
    vote,
    removeVote,
    getPropertyVotes,
    getUserVote,
};
