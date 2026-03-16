import { prisma } from '../../lib/prisma';

/**
 * Get user transaction history
 */
const getMyTransactions = async (userId: string) => {
    return await prisma.transaction.findMany({
        where: { userId },
        include: { investment: { include: { property: true } } },
        orderBy: { createdAt: 'desc' }
    });
};

export const TransactionService = {
    getMyTransactions
};
