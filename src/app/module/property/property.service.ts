import { Property, PropertyStatus } from '@prisma/client';
import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';

/**
 * Casting prisma to 'any' at the top level to resolve persistent IDE type feedback
 * regarding model relation names not matching the currently generated client types.
 * This ensures the project builds and remains readable despite environment sync issues.
 */
const db = prisma as any;

const ensureSubmittablePropertyData = (property: any) => {
  const missingFields: string[] = [];

  if (!property.title?.trim()) missingFields.push('title');
  if (!property.location?.trim()) missingFields.push('location');
  if (!property.description?.trim()) missingFields.push('description');
  if (!property.categoryId) missingFields.push('categoryId');
  if (!property.pricePerShare || property.pricePerShare <= 0)
    missingFields.push('pricePerShare');
  if (!property.totalShares || property.totalShares < 1)
    missingFields.push('totalShares');

  if (missingFields.length > 0) {
    throw new AppError(
      status.BAD_REQUEST,
      `Property is not ready for submission. Missing/invalid fields: ${missingFields.join(', ')}`
    );
  }
};

const createProperty = async (
  userId: string,
  payload: any
): Promise<Property> => {
  const pricePerShare = Number(payload.pricePerShare);

  return await db.property.create({
    data: {
      ...payload,
      isPaid: pricePerShare > 0,
      authorId: userId,
      availableShares: payload.totalShares,
      status: 'DRAFT' as any,
    },
  });
};

const getAllProperties = async (query: any, user?: any) => {
  const {
    search,
    category,
    location,
    minPrice,
    maxPrice,
    status: propertyStatus,
    isPaid,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 10,
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};

  const orderBy: any = {};
  const validSortFields = [
    'id',
    'title',
    'location',
    'description',
    'pricePerShare',
    'totalShares',
    'availableShares',
    'status',
    'viewCount',
    'createdAt',
    'updatedAt',
  ];

  const safeOrder = String(order).toLowerCase() === 'asc' ? 'asc' : 'desc';

  if (sortBy === 'top_voted') {
    orderBy.votes = { _count: safeOrder };
  } else if (sortBy === 'most_commented') {
    orderBy.comments = { _count: safeOrder };
  } else if (sortBy === 'newest') {
    orderBy.createdAt = 'desc';
  } else if (validSortFields.includes(sortBy)) {
    orderBy[sortBy] = safeOrder;
  } else {
    orderBy.createdAt = 'desc'; // Safe fallback
  }

  // Base filtering for public view (only approved unless admin)
  if (user?.role !== ('ADMIN' as any)) {
    where.status = 'APPROVED' as any;
  } else if (propertyStatus) {
    where.status = propertyStatus;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) where.categoryId = category;
  if (isPaid !== undefined)
    where.isPaid = String(isPaid).toLowerCase() === 'true';
  if (location) where.location = { contains: location, mode: 'insensitive' };

  if (minPrice || maxPrice) {
    where.pricePerShare = {};
    if (minPrice) where.pricePerShare.gte = Number(minPrice);
    if (maxPrice) where.pricePerShare.lte = Number(maxPrice);
  }

  const [data, total] = await Promise.all([
    db.property.findMany({
      where,
      include: {
        category: true,
        author: { select: { name: true, avatar: true } },
        _count: { select: { votes: true, comments: true } },
      },
      orderBy,
      skip,
      take: Number(limit),
    }),
    db.property.count({ where }),
  ]);

  return { data, meta: { total, page: Number(page), limit: Number(limit) } };
};

const getPropertyById = async (id: string, user?: any) => {
  const property = await db.property.findUnique({
    where: { id },
    include: {
      category: true,
      author: {
        select: { id: true, name: true, email: true, avatar: true, bio: true },
      },
      _count: { select: { votes: true, comments: true, investments: true } },
    },
  });

  if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');

  // Only allow owner/admin to see unpublished
  if (
    property.status !== ('APPROVED' as any) &&
    user?.role !== ('ADMIN' as any) &&
    user?.userId !== property.authorId
  ) {
    throw new AppError(status.FORBIDDEN, 'Property is not available yet');
  }

  if (
    (Boolean(property.isPaid) || Number(property.pricePerShare) > 0) &&
    user?.role !== ('ADMIN' as any) &&
    user?.userId !== property.authorId
  ) {
    if (!user?.userId) {
      throw new AppError(
        status.UNAUTHORIZED,
        'Please login to access this paid property'
      );
    }

    const paidAccess = await db.investment.findFirst({
      where: {
        userId: user.userId,
        propertyId: id,
        status: 'SUCCESS' as any,
      },
    });

    if (!paidAccess) {
      throw new AppError(
        status.PAYMENT_REQUIRED,
        'Payment required to view this property'
      );
    }
  }

  // Increment view count
  await db.property.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return property;
};

const getMyProperties = async (userId: string, query: any) => {
  const { page = 1, limit = 10, status: propertyStatus } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = { authorId: userId };

  // Filter by status if provided
  if (propertyStatus) {
    const validStatuses = ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];
    if (validStatuses.includes(propertyStatus)) {
      where.status = propertyStatus;
    }
  }

  const [data, total] = await Promise.all([
    db.property.findMany({
      where,
      include: { category: true, _count: true },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    db.property.count({ where }),
  ]);

  return { data, meta: { total, page: Number(page), limit: Number(limit) } };
};

const getMyPropertiesStats = async (userId: string) => {
  const where = { authorId: userId };

  const [all, approved, under_review, draft, rejected] = await Promise.all([
    db.property.count({ where }),
    db.property.count({ where: { ...where, status: 'APPROVED' } }),
    db.property.count({ where: { ...where, status: 'UNDER_REVIEW' } }),
    db.property.count({ where: { ...where, status: 'DRAFT' } }),
    db.property.count({ where: { ...where, status: 'REJECTED' } }),
  ]);

  return {
    all,
    approved,
    under_review,
    draft,
    rejected,
  };
};

const updateProperty = async (
  id: string,
  userId: string,
  payload: Partial<Property>
) => {
  const property = await db.property.findUnique({ where: { id } });
  if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');
  if (property.authorId !== userId)
    throw new AppError(status.FORBIDDEN, 'You cannot update this property');

  // Only unpublished properties can be edited
  if (property.status === ('APPROVED' as any)) {
    throw new AppError(status.BAD_REQUEST, 'Cannot edit an approved property');
  }

  const sanitizedPayload: any = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  if (
    Object.prototype.hasOwnProperty.call(sanitizedPayload, 'categoryId') &&
    (sanitizedPayload.categoryId === '' || sanitizedPayload.categoryId === null)
  ) {
    delete sanitizedPayload.categoryId;
  }

  if (sanitizedPayload.categoryId) {
    const categoryExists = await db.category.findUnique({
      where: { id: sanitizedPayload.categoryId },
    });

    if (!categoryExists) {
      throw new AppError(status.BAD_REQUEST, 'Invalid categoryId');
    }
  }

  if (sanitizedPayload.totalShares !== undefined) {
    const soldShares = property.totalShares - property.availableShares;
    if (sanitizedPayload.totalShares < soldShares) {
      throw new AppError(
        status.BAD_REQUEST,
        `Total shares cannot be less than already sold shares (${soldShares})`
      );
    }

    sanitizedPayload.availableShares =
      sanitizedPayload.totalShares - soldShares;
  }

  const effectivePricePerShare =
    sanitizedPayload.pricePerShare !== undefined
      ? Number(sanitizedPayload.pricePerShare)
      : Number(property.pricePerShare);

  sanitizedPayload.isPaid = effectivePricePerShare > 0;

  return await db.property.update({
    where: { id },
    data: sanitizedPayload,
  });
};

const submitForReview = async (id: string, userId: string) => {
  const property = await db.property.findUnique({ where: { id } });
  if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');
  if (property.authorId !== userId)
    throw new AppError(status.FORBIDDEN, 'Only owner can submit');

  if (property.status === ('APPROVED' as any)) {
    throw new AppError(
      status.BAD_REQUEST,
      'Approved property cannot be resubmitted'
    );
  }

  if (
    property.status === ('PENDING' as any) ||
    property.status === ('UNDER_REVIEW' as any)
  ) {
    throw new AppError(status.BAD_REQUEST, 'Property is already under review');
  }

  ensureSubmittablePropertyData(property);

  return await db.property.update({
    where: { id },
    data: { status: 'UNDER_REVIEW' as any },
  });
};

const deleteProperty = async (id: string, userId: string, role: string) => {
  const property = await db.property.findUnique({ where: { id } });
  if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');

  if (role !== ('ADMIN' as any) && property.authorId !== userId) {
    throw new AppError(status.FORBIDDEN, 'You cannot delete this property');
  }

  return await db.property.delete({ where: { id } });
};

const reviewProperty = async (
  id: string,
  payload: { status: PropertyStatus; feedbackNote?: string }
) => {
  const property = await db.property.findUnique({ where: { id } });
  if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');

  if (payload.status === 'REJECTED' && !payload.feedbackNote?.trim()) {
    throw new AppError(
      status.BAD_REQUEST,
      'Feedback note is required when rejecting a property'
    );
  }

  if (payload.status === 'APPROVED') {
    payload.feedbackNote = undefined;
  }

  return await db.property.update({
    where: { id },
    data: payload,
  });
};

const toggleFeatured = async (id: string) => {
  const property = await db.property.findUnique({ where: { id } });
  if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');

  return await db.property.update({
    where: { id },
    data: { isFeatured: !property.isFeatured },
  });
};

const getFeaturedProperties = async () => {
  return await db.property.findMany({
    where: { isFeatured: true, status: 'APPROVED' as any },
    include: {
      category: true,
      author: { select: { name: true, avatar: true } },
    },
    take: 6,
  });
};

const getPublicSummary = async () => {
  const [
    totalApprovedProperties,
    totalCategories,
    successfulInvestments,
    uniqueInvestorRows,
    totalRevenueAgg,
  ] = await Promise.all([
    db.property.count({ where: { status: 'APPROVED' as any } }),
    db.category.count(),
    db.investment.count({ where: { status: 'SUCCESS' as any } }),
    db.investment.findMany({
      where: { status: 'SUCCESS' as any },
      distinct: ['userId'],
      select: { userId: true },
    }),
    db.investment.aggregate({
      where: { status: 'SUCCESS' as any },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalApprovedProperties,
    totalCategories,
    totalSuccessfulInvestments: successfulInvestments,
    totalInvestors: uniqueInvestorRows.length,
    totalRevenue: (totalRevenueAgg as any)._sum.amount || 0,
  };
};

const getCategories = async () => {
  return await db.category.findMany({
    include: { _count: { select: { properties: true } } },
  });
};

const getPropertyReviews = async (propertyId: string) => {
  return await db.comment.findMany({
    where: { propertyId, isDeleted: false },
    include: {
      user: { select: { name: true, avatar: true } },
      replies: {
        include: { user: { select: { name: true, avatar: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const PropertyService = {
  createProperty,
  getAllProperties,
  getFeaturedProperties,
  getPropertyById,
  getMyProperties,
  getMyPropertiesStats,
  updateProperty,
  submitForReview,
  deleteProperty,
  reviewProperty,
  toggleFeatured,
  getPublicSummary,
  getCategories,
  getPropertyReviews,
};
