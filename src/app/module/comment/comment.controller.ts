import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { CommentService } from './comment.service';

const addComment = catchAsync(async (req: Request, res: Response) => {
    const { content, parentId } = req.body;
    const result = await CommentService.addComment(req.verifiedUser!.userId, req.params.propertyId as string, content, parentId);
    sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: 'Comment added', data: result });
});

const getPropertyComments = catchAsync(async (req: Request, res: Response) => {
    const result = await CommentService.getPropertyComments(req.params.propertyId as string);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Comments fetched', data: result });
});

const updateComment = catchAsync(async (req: Request, res: Response) => {
    const result = await CommentService.updateComment(req.params.commentId as string, req.verifiedUser!.userId, req.body.content);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Comment updated', data: result });
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
    await CommentService.deleteComment(req.params.commentId as string, req.verifiedUser!.userId, req.verifiedUser!.role);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Comment deleted' });
});

export const CommentController = {
    addComment,
    getPropertyComments,
    updateComment,
    deleteComment,
};
