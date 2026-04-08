import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { AIService } from './ai.service';
import '../../interfaces/requestUser.interface';

const getSearchSuggestions = catchAsync(async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const result = await AIService.getSearchSuggestions(query);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'AI Search suggestions retrieved successfully',
    data: result,
  });
});

const getRecommendations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.verifiedUser?.userId;
  const result = await AIService.getRecommendations(userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'AI Recommendations retrieved successfully',
    data: result,
  });
});

const chatAssistant = catchAsync(async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) {
    throw new Error('Message is required to chat with AI');
  }

  const result = await AIService.chatWithAssistant(message);

  res.status(status.OK).send(result);
});

export const AIController = {
  getSearchSuggestions,
  getRecommendations,
  chatAssistant,
};
