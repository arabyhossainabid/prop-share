import { PaymentStatus } from '@prisma/client';
import status from 'http-status';
import { envVars } from '../../config/env';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { stripe } from '../../lib/stripe';

// Casting prisma to any at the top level to resolve persistent IDE type feedback
const db = prisma as any;

const createCheckoutSession = async (
  userId: string,
  propertyId: string,
  shares: number = 1
) => {
  if (!Number.isInteger(shares) || shares < 1) {
    throw new AppError(status.BAD_REQUEST, 'Shares must be a positive integer');
  }

  const property = await db.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) throw new AppError(status.NOT_FOUND, 'Property not found');
  if (property.status !== ('APPROVED' as any)) {
    throw new AppError(
      status.BAD_REQUEST,
      'Only approved properties can be purchased'
    );
  }
  if (!property.isPaid) {
    throw new AppError(
      status.BAD_REQUEST,
      'This property is free and does not require payment'
    );
  }
  if (property.availableShares < shares) {
    throw new AppError(status.BAD_REQUEST, 'Not enough shares available');
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }
  if (!user.isActive) {
    throw new AppError(status.FORBIDDEN, 'Your account is deactivated');
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
            images:
              property.images && property.images.length > 0
                ? [property.images[0]]
                : [],
          },
          unit_amount: Math.round(property.pricePerShare * 100),
        },
        quantity: shares,
      },
    ],
    mode: 'payment',
    success_url: `${envVars.FRONTEND_URL}/properties/${propertyId}?payment=success`,
    cancel_url: `${envVars.FRONTEND_URL}/properties/${propertyId}?payment=cancel`,
    customer_email: user.email,
    metadata: {
      userId,
      propertyId,
      shares: shares.toString(),
      type: 'property_investment',
    },
  });

  // Create a pending investment record
  await db.investment.create({
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

    // Ensure metadata exists
    if (!session.metadata) return;

    const { userId, propertyId, shares } = session.metadata;
    if (!userId || !propertyId || !shares) return;

    await db.$transaction(async (tx: any) => {
      const investment = await tx.investment.findFirst({
        where: { stripeSessionId: session.id },
      });

      if (!investment || investment.status === PaymentStatus.SUCCESS) {
        return;
      }

      // Update investment status
      await tx.investment.update({
        where: { id: investment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          stripePaymentId: session.payment_intent as string,
        },
      });

      const property = await tx.property.findUnique({
        where: { id: propertyId },
      });
      if (!property || property.availableShares < Number(shares)) {
        throw new AppError(
          status.BAD_REQUEST,
          'Property share availability changed before payment confirmation'
        );
      }

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
    await db.investment.updateMany({
      where: { stripeSessionId: session.id },
      data: { status: PaymentStatus.FAILED },
    });
  }
};

const getUserInvestments = async (userId: string) => {
  return await db.investment.findMany({
    where: { userId, status: PaymentStatus.SUCCESS },
    include: { property: { include: { category: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const hasInvestment = async (userId: string, propertyId: string) => {
  const investment = await db.investment.findFirst({
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
