import express from 'express';
import { AIController } from './ai.controller';
import checkAuthOptional from '../../middleware/checkAuthOptional';

const router = express.Router();

// Optional auth so if logged in, we get personalized, if not, trending
router.get(
  '/recommendations',
  checkAuthOptional,
  AIController.getRecommendations
);

router.get(
  '/search-suggestions',
  AIController.getSearchSuggestions
);

router.post(
  '/chat',
  AIController.chatAssistant
);

export const AIRoutes = router;
