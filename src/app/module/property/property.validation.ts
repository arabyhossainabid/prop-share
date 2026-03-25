import { z } from 'zod';

const createPropertySchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .min(3, 'Title must be at least 3 characters'),
    location: z
      .string({ required_error: 'Location is required' })
      .min(2, 'Location is required'),
    description: z
      .string({ required_error: 'Description is required' })
      .min(20, 'Description must be at least 20 characters'),
    problemStatement: z.string().optional(),
    proposedSolution: z.string().optional(),
    images: z.array(z.string()).optional(),
    pricePerShare: z
      .number({ required_error: 'Price per share is required' })
      .positive('Price per share must be greater than 0'),
    totalShares: z
      .number({ required_error: 'Total shares is required' })
      .int('Total shares must be an integer')
      .min(1, 'Total shares must be at least 1'),
    expectedReturn: z
      .number()
      .min(0, 'Expected return cannot be negative')
      .optional(),
    categoryId: z.string({ required_error: 'Category is required' }),
    isPaid: z.boolean().optional(),
  }),
});

const updatePropertySchema = z.object({
  body: z.object({
    title: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    problemStatement: z.string().optional(),
    proposedSolution: z.string().optional(),
    images: z.array(z.string()).optional(),
    pricePerShare: z
      .number()
      .positive('Price per share must be greater than 0')
      .optional(),
    totalShares: z
      .number()
      .int('Total shares must be an integer')
      .min(1, 'Total shares must be at least 1')
      .optional(),
    expectedReturn: z
      .number()
      .min(0, 'Expected return cannot be negative')
      .optional(),
    categoryId: z.string().optional(),
    isPaid: z.boolean().optional(),
  }),
});

const reviewPropertySchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'UNDER_REVIEW']),
    feedbackNote: z.string().optional(),
  }),
});

export const PropertyValidation = {
  createPropertySchema,
  updatePropertySchema,
  reviewPropertySchema,
};
