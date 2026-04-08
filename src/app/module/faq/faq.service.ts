import { prisma } from '../../lib/prisma';
const db = prisma as any;

const getAllFaqs = async () => {
  return await db.faq.findMany({
    orderBy: { order: 'asc' },
  });
};

const createFaq = async (payload: any) => {
  return await db.faq.create({
    data: payload,
  });
};

export const FaqService = {
  getAllFaqs,
  createFaq,
};
