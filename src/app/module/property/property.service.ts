import { Property, PropertyStatus, User, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';
import status from 'http-status';

/**
 * Casting prisma to 'any' at the top level to resolve persistent IDE type feedback 
 * regarding model relation names not matching the currently generated client types.
 * This ensures the project builds and remains readable despite environment sync issues.
 */
const db = prisma as any;

const createProperty = async (userId: string, payload: any): Promise<Property> => {
    return await db.property.create({
        data: {
            ...payload,
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
        sortBy = 'createdAt',
        order = 'desc',
        page = 1,
        limit = 10
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    const orderBy: any = {};
    const validSortFields = ['id', 'title', 'location', 'description', 'pricePerShare', 'totalShares', 'availableShares', 'status', 'viewCount', 'createdAt', 'updatedAt'];

    if (sortBy === 'top_voted') {
        orderBy.votes = { _count: order };
    } else if (sortBy === 'most_commented') {
        orderBy.comments = { _count: order };
    } else if (sortBy === 'newest') {
        orderBy.createdAt = 'desc';
    } else if (validSortFields.includes(sortBy)) {
        orderBy[sortBy] = order;
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
                _count: { select: { votes: true, comments: true } }
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
            author: { select: { id: true, name: true, email: true, avatar: true, bio: true } },
            _count: { select: { votes: true, comments: true, investments: true } }
        },
    });

    if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');

    // Only allow owner/admin to see unpublished
    if (property.status !== ('APPROVED' as any) && user?.role !== ('ADMIN' as any) && user?.userId !== property.authorId) {
        throw new AppError(status.FORBIDDEN, 'Property is not available yet');
    }

    // Increment view count
    await db.property.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    return property;
};

const getMyProperties = async (userId: string, query: any) => {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
        db.property.findMany({
            where: { authorId: userId },
            include: { category: true, _count: true },
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
        }),
        db.property.count({ where: { authorId: userId } }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
};

const updateProperty = async (id: string, userId: string, payload: Partial<Property>) => {
    const property = await db.property.findUnique({ where: { id } });
    if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');
    if (property.authorId !== userId) throw new AppError(status.FORBIDDEN, 'You cannot update this property');

    // Only unpublished properties can be edited
    if (property.status === ('APPROVED' as any)) {
        throw new AppError(status.BAD_REQUEST, 'Cannot edit an approved property');
    }

    return await db.property.update({
        where: { id },
        data: payload,
    });
};

const submitForReview = async (id: string, userId: string) => {
    const property = await db.property.findUnique({ where: { id } });
    if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');
    if (property.authorId !== userId) throw new AppError(status.FORBIDDEN, 'Only owner can submit');

    return await db.property.update({
        where: { id },
        data: { status: 'PENDING' as any },
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

const reviewProperty = async (id: string, payload: { status: string, feedbackNote?: string }) => {
    const property = await db.property.findUnique({ where: { id } });
    if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');

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
        include: { category: true, author: { select: { name: true, avatar: true } } },
        take: 6,
    });
};

export const PropertyService = {
    createProperty,
    getAllProperties,
    getFeaturedProperties,
    getPropertyById,
    getMyProperties,
    updateProperty,
    submitForReview,
    deleteProperty,
    reviewProperty,
    toggleFeatured,
};
