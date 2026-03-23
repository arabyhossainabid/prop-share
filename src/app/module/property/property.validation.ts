import { z } from 'zod';
import { PropertyStatus } from '@prisma/client';

const createPropertySchema = z.object({
    body: z.object({
        title: z.string({ required_error: 'Title is required' }),
        location: z.string({ required_error: 'Location is required' }),
        description: z.string({ required_error: 'Description is required' }),
        problemStatement: z.string().optional(),
        proposedSolution: z.string().optional(),
        images: z.array(z.string()).optional(),
        pricePerShare: z.number({ required_error: 'Price per share is required' }),
        totalShares: z.number({ required_error: 'Total shares is required' }),
        expectedReturn: z.number().optional(),
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
        pricePerShare: z.number().optional(),
        totalShares: z.number().optional(),
        expectedReturn: z.number().optional(),
        categoryId: z.string().optional(),
        isPaid: z.boolean().optional(),
    }),
});

const reviewPropertySchema = z.object({
    body: z.object({
        status: z.enum([PropertyStatus.APPROVED, PropertyStatus.REJECTED, PropertyStatus.UNDER_REVIEW]),
        feedbackNote: z.string().optional(),
    }),
});

export const PropertyValidation = {
    createPropertySchema,
    updatePropertySchema,
    reviewPropertySchema,
};
