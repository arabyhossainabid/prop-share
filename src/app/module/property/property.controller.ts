import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { PropertyService } from './property.service';

const createProperty = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.createProperty(
    req.verifiedUser!.userId,
    req.body
  );
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Property created successfully',
    data: result,
  });
});

const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.getAllProperties(
    req.query,
    req.verifiedUser
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Properties fetched successfully',
    data: result,
  });
});

const getFeaturedProperties = catchAsync(
  async (req: Request, res: Response) => {
    const result = await PropertyService.getFeaturedProperties();
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: 'Featured properties fetched',
      data: result,
    });
  }
);

const getPublicSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.getPublicSummary();
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Public summary fetched',
    data: result,
  });
});

const getPropertyById = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.getPropertyById(
    req.params.id as string,
    req.verifiedUser
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Property fetched successfully',
    data: result,
  });
});

const getMyProperties = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.getMyProperties(
    req.verifiedUser!.userId,
    req.query
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Your properties fetched',
    data: result,
  });
});

const getMyPropertiesStats = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.getMyPropertiesStats(
    req.verifiedUser!.userId
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Your properties stats fetched',
    data: result,
  });
});

const updateProperty = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.updateProperty(
    req.params.id as string,
    req.verifiedUser!.userId,
    req.body
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Property updated successfully',
    data: result,
  });
});

const submitForReview = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.submitForReview(
    req.params.id as string,
    req.verifiedUser!.userId
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Property submitted for review',
    data: result,
  });
});

const deleteProperty = catchAsync(async (req: Request, res: Response) => {
  await PropertyService.deleteProperty(
    req.params.id as string,
    req.verifiedUser!.userId,
    req.verifiedUser!.role
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Property deleted successfully',
  });
});

const reviewProperty = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.reviewProperty(
    req.params.id as string,
    req.body
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: `Property ${req.body.status.toLowerCase()} successfully`,
    data: result,
  });
});

const toggleFeatured = catchAsync(async (req: Request, res: Response) => {
  const result = await PropertyService.toggleFeatured(req.params.id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Featured status toggled',
    data: result,
  });
});

export const PropertyController = {
  createProperty,
  getAllProperties,
  getFeaturedProperties,
  getPublicSummary,
  getPropertyById,
  getMyProperties,
  getMyPropertiesStats,
  updateProperty,
  submitForReview,
  deleteProperty,
  reviewProperty,
  toggleFeatured,
};
