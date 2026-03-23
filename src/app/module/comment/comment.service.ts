import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';
import status from 'http-status';
import { Role } from '@prisma/client';

const addComment = async (userId: string, propertyId: string, content: string, parentId?: string) => {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');

    return await prisma.comment.create({
        data: {
            userId,
            propertyId,
            content,
            parentId,
        },
        include: { user: { select: { name: true, avatar: true } } },
    });
};

const getPropertyComments = async (propertyId: string) => {
    return await prisma.comment.findMany({
        where: { propertyId, parentId: null, isDeleted: false },
        include: {
            user: { select: { name: true, avatar: true } },
            replies: {
                where: { isDeleted: false },
                include: { user: { select: { name: true, avatar: true } } },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};

const updateComment = async (commentId: string, userId: string, content: string) => {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError(status.NOT_FOUND, 'Comment not found');
    if (comment.userId !== userId) throw new AppError(status.FORBIDDEN, 'You cannot edit this comment');

    return await prisma.comment.update({
        where: { id: commentId },
        data: { content },
    });
};

const deleteComment = async (commentId: string, userId: string, role: Role) => {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError(status.NOT_FOUND, 'Comment not found');

    if (role !== Role.ADMIN && comment.userId !== userId) {
        throw new AppError(status.FORBIDDEN, 'You cannot delete this comment');
    }

    // Soft delete
    return await prisma.comment.update({
        where: { id: commentId },
        data: { isDeleted: true },
    });
};

export const CommentService = {
    addComment,
    getPropertyComments,
    updateComment,
    deleteComment,
};
