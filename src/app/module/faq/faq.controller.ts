import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { FaqService } from './faq.service';

const getAllFaqs = catchAsync(async (req: Request, res: Response) => {
  const result = await FaqService.getAllFaqs();
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'FAQs fetched successfully',
    data: result,
  });
});

const createFaq = catchAsync(async (req: Request, res: Response) => {
  const result = await FaqService.createFaq(req.body);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'FAQ created successfully',
    data: result,
  });
});

export const FaqController = {
  getAllFaqs,
  createFaq,
};
