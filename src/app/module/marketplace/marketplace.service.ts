import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';
import status from 'http-status';

/**
 * List shares for sale in secondary market
 */
const listSharesForSale = async (userId: string, payload: { propertyId: string; shares: number; pricePerShare: number }) => {
    const { propertyId, shares, pricePerShare } = payload;

    // Check if user has enough shares
    const userInvestment = await prisma.investment.findFirst({
        where: { userId, propertyId }
    });

    if (!userInvestment || userInvestment.sharesBought < shares) {
        throw new AppError(status.BAD_REQUEST, 'Insufficient shares to list for sale');
    }

    return await prisma.marketListing.create({
        data: {
            propertyId,
            sellerId: userId,
            shares,
            pricePerShare,
            status: 'ACTIVE'
        }
    });
};

/**
 * Buy shares from secondary market
 */
const buyFromMarket = async (buyerId: string, listingId: string) => {
    return await prisma.$transaction(async (tx) => {
        const listing = await tx.marketListing.findUnique({
            where: { id: listingId }
        });

        if (!listing || listing.status !== 'ACTIVE') {
            throw new AppError(status.NOT_FOUND, 'Listing not available');
        }

        if (listing.sellerId === buyerId) {
            throw new AppError(status.BAD_REQUEST, 'You cannot buy your own listing');
        }

        // 1. Update listing status
        await tx.marketListing.update({
            where: { id: listingId },
            data: { status: 'SOLD', buyerId }
        });

        // 2. Reduce shares from seller
        const sellerInvestment = await tx.investment.findFirst({
            where: { userId: listing.sellerId, propertyId: listing.propertyId }
        });

        await tx.investment.update({
            where: { id: sellerInvestment!.id },
            data: { sharesBought: { decrement: listing.shares } }
        });

        // 3. Add shares to buyer
        const buyerInvestment = await tx.investment.upsert({
            where: {
                id: (await tx.investment.findFirst({ where: { userId: buyerId, propertyId: listing.propertyId } }))?.id || 'dummy'
            },
            update: { sharesBought: { increment: listing.shares } },
            create: {
                userId: buyerId,
                propertyId: listing.propertyId,
                sharesBought: listing.shares,
                totalAmount: listing.shares * listing.pricePerShare
            }
        });

        // 4. Record transaction
        await tx.transaction.create({
            data: {
                userId: buyerId,
                amount: listing.shares * listing.pricePerShare,
                type: 'MARKET_PURCHASE',
                status: 'SUCCESS'
            }
        });

        return { success: true };
    });
};

/**
 * Get all active marketplace listings
 */
const getAllListings = async () => {
    return await prisma.marketListing.findMany({
        where: { status: 'ACTIVE' },
        include: {
            property: true,
            seller: { select: { name: true, avatar: true } }
        }
    });
};

export const MarketplaceService = {
    listSharesForSale,
    buyFromMarket,
    getAllListings
};
