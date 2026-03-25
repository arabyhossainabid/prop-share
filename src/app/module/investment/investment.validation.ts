import { z } from 'zod';

const createCheckoutSessionSchema = z.object({
  params: z.object({
    propertyId: z
      .string({ required_error: 'Property id is required' })
      .min(1, 'Property id is required'),
  }),
  body: z.object({
    shares: z
      .number({ invalid_type_error: 'Shares must be a number' })
      .int('Shares must be an integer')
      .min(1, 'Shares must be at least 1')
      .max(1000, 'Shares limit exceeded')
      .optional(),
  }),
});

export const InvestmentValidation = {
  createCheckoutSessionSchema,
};
