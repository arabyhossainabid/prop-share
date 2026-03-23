import { prisma } from '../../lib/prisma';
import { stripe } from '../../lib/stripe';
import AppError from '../../errorHelpers/AppError';
import status from 'http-status';
import { envVars } from '../../config/env';
import { PaymentStatus } from '@prisma/client';

const createCheckoutSession = async (userId: string, propertyId: string, shares: number = 1) => {
    const property = await prisma.property.findUnique({
        where: { id: propertyId },
    });

    if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');
    if (property.availableShares < shares) {
        throw new AppError(status.BAD_REQUEST, 'Not enough shares available');
    }

    const totalAmount = property.pricePerShare * shares;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: property.title,
                        description: `Investment in ${property.title} - ${shares} share(s)`,
                        images: property.images.length > 0 ? [property.images[0]] : [],
                    },
                    unit_amount: Math.round(property.pricePerShare * 100),
                },
                quantity: shares,
            },
        ],
        mode: 'payment',
        success_url: `${envVars.FRONTEND_URL}/properties/${propertyId}?payment=success`,
        cancel_url: `${envVars.FRONTEND_URL}/properties/${propertyId}?payment=cancel`,
        customer_email: (await prisma.user.findUnique({ where: { id: userId } }))?.email,
        metadata: {
            userId,
            propertyId,
            shares: shares.toString(),
            type: 'property_investment',
        },
    });

    // Create a pending investment record
    await prisma.investment.create({
        data: {
            userId,
            propertyId,
            amount: totalAmount,
            shares,
            stripeSessionId: session.id,
            status: PaymentStatus.PENDING,
        },
    });

    return { url: session.url };
};

const handleWebhook = async (event: any) => {
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, propertyId, shares } = session.metadata;

        await prisma.$transaction(async (tx) => {
            // Update investment status
            await tx.investment.updateMany({
                where: { stripeSessionId: session.id },
                data: {
                    status: PaymentStatus.SUCCESS,
                    stripePaymentId: session.payment_intent as string,
                },
            });

            // Update property available shares
            await tx.property.update({
                where: { id: propertyId },
                data: {
                    availableShares: {
                        decrement: Number(shares),
                    },
                },
            });
        });
    } else if (event.type === 'checkout.session.expired') {
        const session = event.data.object;
        await prisma.investment.updateMany({
            where: { stripeSessionId: session.id },
            data: { status: PaymentStatus.FAILED },
        });
    }
};

const getUserInvestments = async (userId: string) => {
    return await prisma.investment.findMany({
        where: { userId, status: PaymentStatus.SUCCESS },
        include: { property: { include: { category: true } } },
        orderBy: { createdAt: 'desc' },
    });
};

const hasInvestment = async (userId: string, propertyId: string) => {
    const investment = await prisma.investment.findFirst({
        where: { userId, propertyId, status: PaymentStatus.SUCCESS },
    });
    return !!investment;
};

export const InvestmentService = {
    createCheckoutSession,
    handleWebhook,
    getUserInvestments,
    hasInvestment,
};
