import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { CategoryService } from './category.service';

const createCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.createCategory(req.body);
    sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: 'Category created', data: result });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getAllCategories();
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Categories fetched', data: result });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getCategoryById(req.params.id as string);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Category fetched', data: result });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.updateCategory(req.params.id as string, req.body);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Category updated', data: result });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    await CategoryService.deleteCategory(req.params.id as string);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Category deleted' });
});

export const CategoryController = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};
