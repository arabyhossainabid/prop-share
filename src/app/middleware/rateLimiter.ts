import rateLimit from 'express-rate-limit';

export const aiRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Your request limit is over. Please wait 10 minutes before trying again.',
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});
