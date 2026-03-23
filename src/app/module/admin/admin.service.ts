import { User, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';
import status from 'http-status';

const getAllUsers = async (query: any) => {
    const { page = 1, limit = 10, search } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [data, total] = await Promise.all([
        prisma.user.findMany({
            where,
            include: { _count: { select: { properties: true, investments: true } } },
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
};

const updateUserStatus = async (userId: string, isActive: boolean) => {
    return await prisma.user.update({
        where: { id: userId },
        data: { isActive },
    });
};

const updateUserRole = async (userId: string, role: Role) => {
    return await prisma.user.update({
        where: { id: userId },
        data: { role },
    });
};

const getDashboardStats = async () => {
    const [
        totalUsers,
        totalProperties,
        pendingReview,
        approvedProperties,
        totalCategories,
        totalInvestments,
        totalRevenue,
        recentProperties,
        topVotedProperties,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.property.count(),
        prisma.property.count({ where: { status: 'PENDING' } }),
        prisma.property.count({ where: { status: 'APPROVED' } }),
        prisma.category.count(),
        prisma.investment.count({ where: { status: 'SUCCESS' } }),
        prisma.investment.aggregate({
            where: { status: 'SUCCESS' },
            _sum: { amount: true },
        }),
        prisma.property.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { author: { select: { name: true } }, category: true },
        }),
        prisma.property.findMany({
            take: 5,
            where: { status: 'APPROVED' },
            orderBy: { votes: { _count: 'desc' } },
            include: { author: { select: { name: true } }, category: true },
        }),
    ]);

    return {
        counters: {
            totalUsers,
            totalProperties,
            pendingReview,
            approvedProperties,
            totalCategories,
            totalInvestments,
            totalRevenue: totalRevenue._sum.amount || 0,
        },
        recentProperties,
        topVotedProperties,
    };
};

const getAllPropertiesAdmin = async (query: any) => {
    const { page = 1, limit = 10, status: propertyStatus } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (propertyStatus) where.status = propertyStatus;

    const [data, total] = await Promise.all([
        prisma.property.findMany({
            where,
            include: { author: { select: { name: true, email: true } }, category: true },
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
        }),
        prisma.property.count({ where }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
};

const getAllInvestmentsAdmin = async (query: any) => {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
        prisma.investment.findMany({
            include: { user: { select: { name: true, email: true } }, property: { select: { title: true } } },
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
        }),
        prisma.investment.count(),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
};

export const AdminService = {
    getAllUsers,
    updateUserStatus,
    updateUserRole,
    getDashboardStats,
    getAllPropertiesAdmin,
    getAllInvestmentsAdmin,
};
