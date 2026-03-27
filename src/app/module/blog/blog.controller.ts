import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { BlogService } from './blog.service';

const getAllBlogs = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const featured =
    req.query.featured === 'true'
      ? true
      : req.query.featured === 'false'
        ? false
        : undefined;

  const result = await BlogService.getAllBlogs(skip, limit, featured);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Blogs retrieved successfully',
    data: result.blogs,
  });
});

const getFeaturedBlogs = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.getAllBlogs(0, 5, true);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Featured blogs retrieved successfully',
    data: result.blogs,
  });
});

export const BlogController = {
  getAllBlogs,
  getFeaturedBlogs,
};
