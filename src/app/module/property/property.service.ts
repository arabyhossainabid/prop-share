import { Property, PropertyStatus, User, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';
import status from 'http-status';

const createProperty = async (userId: string, payload: any): Promise<Property> => {
    return await prisma.property.create({
        data: {
            ...payload,
            authorId: userId,
            availableShares: payload.totalShares,
            status: PropertyStatus.DRAFT,
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

    // Base filtering for public view (only approved unless admin)
    if (user?.role !== Role.ADMIN) {
        where.status = PropertyStatus.APPROVED;
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
        prisma.property.findMany({
            where,
            include: {
                category: true,
                author: { select: { name: true, avatar: true } },
                _count: { select: { votes: true, comments: true } }
            },
            orderBy: { [sortBy]: order },
            skip,
            take: Number(limit),
        }),
        prisma.property.count({ where }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
};

const getPropertyById = async (id: string, user?: any) => {
    const property = await prisma.property.findUnique({
        where: { id },
        include: {
            category: true,
            author: { select: { id: true, name: true, email: true, avatar: true, bio: true } },
            _count: { select: { votes: true, comments: true, investments: true } }
        },
    });

    if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');

    // Only allow owner/admin to see unpublished
    if (property.status !== PropertyStatus.APPROVED && user?.role !== Role.ADMIN && user?.userId !== property.authorId) {
        throw new AppError(status.FORBIDDEN, 'Property is not available yet');
    }

    // Increment view count
    await prisma.property.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    return property;
};

const getMyProperties = async (userId: string, query: any) => {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
        prisma.property.findMany({
            where: { authorId: userId },
            include: { category: true, _count: true },
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
        }),
        prisma.property.count({ where: { authorId: userId } }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
};

const updateProperty = async (id: string, userId: string, payload: Partial<Property>) => {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');
    if (property.authorId !== userId) throw new AppError(status.FORBIDDEN, 'You cannot update this property');

    // Only unpublished properties can be edited
    if (property.status === PropertyStatus.APPROVED) {
        throw new AppError(status.BAD_REQUEST, 'Cannot edit an approved property');
    }

    return await prisma.property.update({
        where: { id },
        data: payload,
    });
};

const submitForReview = async (id: string, userId: string) => {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');
    if (property.authorId !== userId) throw new AppError(status.FORBIDDEN, 'Only owner can submit');

    return await prisma.property.update({
        where: { id },
        data: { status: PropertyStatus.PENDING },
    });
};

const deleteProperty = async (id: string, userId: string, role: Role) => {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');

    if (role !== Role.ADMIN && property.authorId !== userId) {
        throw new AppError(status.FORBIDDEN, 'You cannot delete this property');
    }

    return await prisma.property.delete({ where: { id } });
};

const reviewProperty = async (id: string, payload: { status: PropertyStatus, feedbackNote?: string }) => {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');

    return await prisma.property.update({
        where: { id },
        data: payload,
    });
};

const toggleFeatured = async (id: string) => {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');

    return await prisma.property.update({
        where: { id },
        data: { isFeatured: !property.isFeatured },
    });
};

const getFeaturedProperties = async () => {
    return await prisma.property.findMany({
        where: { isFeatured: true, status: PropertyStatus.APPROVED },
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
