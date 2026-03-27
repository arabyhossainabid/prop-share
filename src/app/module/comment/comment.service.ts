import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';

const addComment = async (
  userId: string,
  propertyId: string,
  content: string,
  parentId?: string
) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
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

export const CommentService = {
  addComment,
  getPropertyComments,
};
