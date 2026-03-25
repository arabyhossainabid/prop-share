import { z } from 'zod';

const createContactSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }),
        email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
        subject: z.string().optional(),
        message: z.string({ required_error: 'Message is required' }).min(10, 'Message must be at least 10 characters'),
    }),
});

export const ContactValidation = {
    createContactSchema,
};
