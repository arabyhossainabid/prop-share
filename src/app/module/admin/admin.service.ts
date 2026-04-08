import { Role } from '@prisma/client';
import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';

// Casting prisma to any at the top level to resolve persistent IDE type feedback
// regarding model relation names not matching the currently generated client types.
const db = prisma as any;

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
    db.user.findMany({
      where,
      include: { _count: { select: { properties: true, investments: true } } },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    db.user.count({ where }),
  ]);

  return { data, meta: { total, page: Number(page), limit: Number(limit) } };
};

const updateUserRole = async (userId: string, role: Role) => {
  return await db.user.update({
    where: { id: userId },
    data: { role },
  });
};

const deleteUser = async (userId: string) => {
  return await db.user.delete({
    where: { id: userId },
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
    propertiesByCategory,
  ] = await Promise.all([
    db.user.count(),
    db.property.count(),
    db.property.count({ where: { status: 'PENDING' } }),
    db.property.count({ where: { status: 'APPROVED' } }),
    db.category.count(),
    db.investment.count({ where: { status: 'SUCCESS' } }),
    db.investment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
    }),
    db.property.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } }, category: true },
    }),
    db.property.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true },
    }),
  ]);

  // Transform propertiesByCategory for Pie chart
  const categories = await db.category.findMany({
    select: { id: true, name: true },
  });
  const pieChartData = propertiesByCategory.map((curr: any) => ({
    name: categories.find((c: any) => c.id === curr.categoryId)?.name || 'Unknown',
    value: curr._count.categoryId,
  }));

  return {
    counters: {
      totalUsers,
      totalProperties,
      pendingReview,
      approvedProperties,
      totalCategories,
      totalInvestments,
      totalRevenue: (totalRevenue as any)._sum.amount || 0,
    },
    recentProperties,
    charts: {
      propertiesByCategory: pieChartData,
    },
  };
};

const getAllPropertiesAdmin = async (query: any) => {
  const { page = 1, limit = 10, status: propertyStatus } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (propertyStatus) where.status = propertyStatus;

  const [data, total] = await Promise.all([
    db.property.findMany({
      where,
      include: {
        author: { select: { name: true, email: true } },
        category: true,
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    db.property.count({ where }),
  ]);

  return { data, meta: { total, page: Number(page), limit: Number(limit) } };
};

const getAllInvestmentsAdmin = async (query: any) => {
  const { page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    db.investment.findMany({
      include: {
        user: { select: { name: true, email: true } },
        property: { select: { title: true } },
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    db.investment.count(),
  ]);

  return { data, meta: { total, page: Number(page), limit: Number(limit) } };
};

const createCategory = async (payload: {
  name: string;
  description?: string;
  icon?: string;
}) => {
  return await db.category.create({
    data: payload,
  });
};

const updateCategory = async (categoryId: string, payload: any) => {
  return await db.category.update({
    where: { id: categoryId },
    data: payload,
  });
};

const deleteCategory = async (categoryId: string) => {
  const hasProperties = await db.property.count({
    where: { categoryId },
  });

  if (hasProperties > 0) {
    throw new AppError(
      status.BAD_REQUEST,
      'Cannot delete category with associated properties'
    );
  }

  return await db.category.delete({
    where: { id: categoryId },
  });
};

const updatePropertyFeatured = async (
  propertyId: string,
  isFeatured: boolean
) => {
  return await db.property.update({
    where: { id: propertyId },
    data: { isFeatured },
  });
};

export const AdminService = {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getDashboardStats,
  getAllPropertiesAdmin,
  getAllInvestmentsAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  updatePropertyFeatured,
};
