// Legacy file - webhook handling is now done inside payment.controller.ts
// This file kept for compatibility only

export const handleStripeWebhook = async (sig: string, body: Buffer) => {
    // Handled in payment module
    return { received: true };
};
