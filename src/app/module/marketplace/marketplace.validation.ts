import { z } from 'zod';

const listShares = z.object({
    body: z.object({
        propertyId: z.string().cuid(),
        shares: z.number().int().positive(),
        pricePerShare: z.number().positive(),
    }),
});

export const MarketplaceValidation = {
    listShares,
};
