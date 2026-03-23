import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';
import status from 'http-status';
import { VoteType } from '@prisma/client';

const vote = async (userId: string, propertyId: string, voteType: VoteType) => {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');

    const result = await prisma.vote.upsert({
        where: { userId_propertyId: { userId, propertyId } },
        update: { voteType },
        create: { userId, propertyId, voteType },
    });

    return { message: 'Vote recorded', data: result };
};

const removeVote = async (userId: string, propertyId: string) => {
    await prisma.vote.delete({
        where: { userId_propertyId: { userId, propertyId } },
    });
    return { message: 'Vote removed' };
};

const getPropertyVotes = async (propertyId: string) => {
    const votes = await prisma.vote.findMany({ where: { propertyId } });
    const upvotes = votes.filter(v => v.voteType === VoteType.UPVOTE).length;
    const downvotes = votes.filter(v => v.voteType === VoteType.DOWNVOTE).length;
    return { upvotes, downvotes, total: upvotes - downvotes };
};

const getUserVoteOnProperty = async (userId: string, propertyId: string) => {
    return await prisma.vote.findUnique({
        where: { userId_propertyId: { userId, propertyId } },
    });
};

export const VoteService = {
    vote,
    removeVote,
    getPropertyVotes,
    getUserVoteOnProperty,
};
