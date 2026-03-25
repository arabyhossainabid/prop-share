import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import status from 'http-status';
import { ContactService } from './contact.service';

const submitMessage = catchAsync(async (req: Request, res: Response) => {
    const result = await ContactService.createMessage(req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: 'Your message has been sent successfully',
        data: result,
    });
});

const getAllMessages = catchAsync(async (req: Request, res: Response) => {
    const result = await ContactService.getAllMessages();

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Contact messages retrieved successfully',
        data: result,
    });
});

const deleteMessage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await ContactService.deleteMessage(id as string);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Message deleted successfully',
        data: null,
    });
});

export const ContactController = {
    submitMessage,
    getAllMessages,
    deleteMessage,
};
