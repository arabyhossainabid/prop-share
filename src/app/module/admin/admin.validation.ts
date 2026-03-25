import { z } from 'zod';

const updateUserStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive is required' }),
  }),
});

const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'USER']),
  }),
});

const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Category name is required' })
      .min(2, 'Category name must be at least 2 characters'),
    description: z.string().optional(),
    icon: z.string().optional(),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Category name must be at least 2 characters')
      .optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
  }),
});

const updatePropertyFeaturedSchema = z.object({
  body: z.object({
    isFeatured: z.boolean({ required_error: 'isFeatured is required' }),
  }),
});

export const AdminValidation = {
  updateUserStatusSchema,
  updateUserRoleSchema,
  createCategorySchema,
  updateCategorySchema,
  updatePropertyFeaturedSchema,
};
