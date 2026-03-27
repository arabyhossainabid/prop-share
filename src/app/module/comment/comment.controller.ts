import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { CommentService } from './comment.service';

const addComment = catchAsync(async (req: Request, res: Response) => {
  const { content, parentId } = req.body;
  const result = await CommentService.addComment(
    req.verifiedUser!.userId,
    req.params.propertyId as string,
    content,
    parentId
  );
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Comment added',
    data: result,
  });
});

const getPropertyComments = catchAsync(async (req: Request, res: Response) => {
  const result = await CommentService.getPropertyComments(
    req.params.propertyId as string
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Comments fetched',
    data: result,
  });
});

export const CommentController = {
  addComment,
  getPropertyComments,
};
