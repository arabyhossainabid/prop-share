import express from 'express';
import { AIController } from './ai.controller';
import checkAuthOptional from '../../middleware/checkAuthOptional';
import { aiRateLimiter } from '../../middleware/rateLimiter';

const router = express.Router();

// Optional auth so if logged in, we get personalized, if not, trending
router.get(
  '/recommendations',
  checkAuthOptional,
  aiRateLimiter, // Optional: we can apply rate limiter here as well
  AIController.getRecommendations
);

router.get(
  '/search-suggestions',
  aiRateLimiter, // Optional: applying here so it doesn't get spammed
  AIController.getSearchSuggestions
);

router.get(
  '/trending',
  aiRateLimiter,
  AIController.getTrending
);

router.post(
  '/chat',
  aiRateLimiter, // Apply 5 max requests per 10 mins
  AIController.chatAssistant
);

export const AIRoutes = router;
