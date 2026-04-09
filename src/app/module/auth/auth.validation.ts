import { z } from 'zod';

const register = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z
      .string()
      .min(6, 'Phone number is too short')
      .max(20, 'Phone number is too long')
      .optional(),
    bio: z.string().optional(),
  }),
});

const login = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const forgotPassword = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

const resetPassword = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

const updateProfile = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    bio: z.string().optional(),
    avatar: z.string().url().optional(),
  }),
});

export const AuthValidation = {
  register,
  login,
  forgotPassword,
  resetPassword,
  updateProfile,
};
