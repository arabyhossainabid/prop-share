import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';
import status from 'http-status';

const createCategory = async (payload: { name: string; description?: string; icon?: string }) => {
    return await prisma.category.create({ data: payload });
};

const getAllCategories = async () => {
    return await prisma.category.findMany({
        include: { _count: { select: { properties: true } } },
        orderBy: { name: 'asc' },
    });
};

const getCategoryById = async (id: string) => {
    const category = await prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { properties: true } } },
    });
    if (!category) throw new AppError(status.NOT_FOUND, 'Category not found');
    return category;
};

const updateCategory = async (id: string, payload: any) => {
    return await prisma.category.update({ where: { id }, data: payload });
};

const deleteCategory = async (id: string) => {
    return await prisma.category.delete({ where: { id } });
};

export const CategoryService = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};
