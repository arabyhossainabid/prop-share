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
  const requiresPayment =
    Boolean(property.isPaid) || Number(property.pricePerShare) > 0;
  if (!requiresPayment) {
    throw new AppError(
      status.BAD_REQUEST,
      'This property is currently listed as free and cannot be purchased. Please check back later or contact support if this is an error.'
    );
  }
  if (property.pricePerShare <= 0) {
    throw new AppError(
      status.BAD_REQUEST,
      'Invalid property price for checkout session'
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
    success_url: `${envVars.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${envVars.FRONTEND_URL}/payment/cancel`,
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

const getCheckoutSessionDetails = async (sessionId: string, userId: string) => {
  const investment = await db.investment.findFirst({
    where: { stripeSessionId: sessionId },
    include: {
      property: { select: { id: true, title: true, images: true } },
    },
  });

  if (!investment) {
    throw new AppError(status.NOT_FOUND, 'Checkout session not found');
  }

  if (investment.userId !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      'You cannot access this checkout session'
    );
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return {
    sessionId,
    paymentStatus: investment.status,
    amount: investment.amount,
    shares: investment.shares,
    stripePaymentStatus: session.payment_status,
    customerEmail: session.customer_email,
    property: investment.property,
    createdAt: investment.createdAt,
  };
};

const getPaymentFailureReason = async (transactionId: string) => {
  const investment = await db.investment.findUnique({
    where: { id: transactionId },
    include: {
      property: { select: { id: true, title: true } },
      user: { select: { name: true, email: true } },
    },
  });

  if (!investment) {
    throw new AppError(status.NOT_FOUND, 'Transaction not found');
  }

  let failureReason = 'Unknown error - Please contact support';
  let failureCode = 'unknown_error';

  if (investment.status === PaymentStatus.FAILED) {
    // Try to retrieve Stripe session for detailed error info
    if (investment.stripeSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          investment.stripeSessionId
        );
        if ((session as any).last_payment_error) {
          failureReason =
            (session as any).last_payment_error.message || failureReason;
          failureCode = (session as any).last_payment_error.code || failureCode;
        } else {
          failureReason = 'Payment session expired or was cancelled';
          failureCode = 'session_expired';
        }
      } catch (err) {
        failureReason = 'Could not retrieve payment details from Stripe';
      }
    }
  } else if (investment.status === PaymentStatus.PENDING) {
    failureReason = 'Payment is still pending - not yet completed';
    failureCode = 'pending';
  } else {
    failureReason = 'Payment was successful';
    failureCode = 'success';
  }

  return {
    transactionId,
    status: investment.status,
    failureReason,
    failureCode,
    amount: investment.amount,
    shares: investment.shares,
    property: investment.property,
    createdAt: investment.createdAt,
    timestamp: new Date(),
  };
};

export const InvestmentService = {
  createCheckoutSession,
  handleWebhook,
  getUserInvestments,
  hasInvestment,
  getCheckoutSessionDetails,
  getPaymentFailureReason,
};
