import { z } from 'zod';

const create = z.object({
    body: z.object({
        name: z.string().min(2, 'Category name must be at least 2 characters'),
        description: z.string().optional(),
        icon: z.string().optional(),
    }),
});

const update = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
    }),
});

export const CategoryValidation = { create, update };
