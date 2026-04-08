import { prisma } from '../../lib/prisma';
import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
const db = prisma as any;
/**
 * Simulates an AI-powered search suggestions feature.
 * Analyzes query, extracts trends, and predicts categories/keywords.
 */
const getSearchSuggestions = async (query: string) => {
  if (!query || query.length < 1) { // Immediate results
    return [];
  }

  // Optimize: Search categories and properties in parallel for maximum speed
  const [properties, categories] = await Promise.all([
    db.property.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 6,
      select: { title: true, location: true },
    }),
    db.category.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take: 2,
      select: { name: true },
    })
  ]);

  const suggestions = new Set<string>();
  
  // High priority: Category matches
  categories.forEach((cat: any) => suggestions.add(cat.name));
  
  // Mid priority: Property matches
  properties.forEach((p: any) => {
    suggestions.add(p.title);
    suggestions.add(p.location);
  });

  return Array.from(suggestions).slice(0, 10);
};
/**
 * Predicts and recommends properties based on user's investment history
 * or simply returns trending items automatically using activity (viewCount).
 */
const getRecommendations = async (userId?: string) => {
  let recommendedCategoryIds: string[] = [];
  if (userId) {
    // Basic AI logic: Find categories the user has already invested in
    const userInvestments = await db.investment.findMany({
      where: { userId, status: 'SUCCESS' },
      include: { property: { select: { categoryId: true } } },
    });
    if (userInvestments.length > 0) {
      recommendedCategoryIds = Array.from(
        new Set(userInvestments.map((inv: any) => inv.property.categoryId))
      );
    }
  }
  // Get trending based on high view count and expected return
  let trendingProperties = await db.property.findMany({
    where: { status: 'APPROVED' },
    orderBy: [{ viewCount: 'desc' }, { expectedReturn: 'desc' }],
    take: 5,
    include: {
      category: true,
      author: { select: { name: true, avatar: true } },
    },
  });
  // If user has specific category interests, try to blend in personalized ones
  if (recommendedCategoryIds.length > 0) {
    const personalized = await db.property.findMany({
      where: {
        status: 'APPROVED',
        categoryId: { in: recommendedCategoryIds as string[] },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        category: true,
        author: { select: { name: true, avatar: true } },
      },
    });
    // Merge and deduplicate
    const combined = [...personalized, ...trendingProperties];
    const uniqueIds = new Set();
    trendingProperties = combined.filter((p) => {
      if (!uniqueIds.has(p.id)) {
        uniqueIds.add(p.id);
        return true;
      }
      return false;
    }).slice(0, 6);
  }
  return trendingProperties;
};
import { envVars } from '../../config/env';
export const AIService = {
  getSearchSuggestions,
  getRecommendations,
  chatWithAssistant: async (message: string) => {
    if (!envVars.OPENROUTER_API_KEY) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        'OpenRouter API key is missing. Please configure OPENROUTER_API_KEY in .env file.'
      );
    }

    // Fetch live data from database to provide context to the AI
    const liveProperties = await db.property.findMany({
      where: { status: 'APPROVED' },
      take: 10,
      select: { title: true, location: true, pricePerShare: true, expectedReturn: true, availableShares: true }
    });

    const contextString = liveProperties.map((p: any) => 
      `- ${p.title} in ${p.location}. Price: $${p.pricePerShare}/share, ROI: ${p.expectedReturn}%, Available: ${p.availableShares} shares.`
    ).join('\n');

    // Prioritize high-quality OpenAI models via OpenRouter for precise answers
    const modelsToTry = [
      'openai/gpt-4o-mini',
      'openai/gpt-3.5-turbo',
      'openrouter/auto'
    ];

    let lastErrorDetails = '';

    for (const model of modelsToTry) {
      try {
        console.log(`[AI-CHAT] Attempting specific response with model: ${model}`);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${envVars.OPENROUTER_API_KEY.trim()}`,
            'HTTP-Referer': envVars.FRONTEND_URL || 'http://localhost:3000',
            'X-Title': 'PropShare AI Assistant',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: `You are the PropShare AI Assistant. You have access to real-time property data from our database. 
                
                CURRENT AVAILABLE PROPERTIES:
                ${contextString}
                
                INSTRUCTIONS:
                1. Answer user queries directly and ONLY based on the available data above.
                2. Do NOT provide generic welcomes or intros unless specifically asked.
                3. Be extremely concise and specific. 
                4. If a user asks about "Abid", he is likely the developer or an admin of this platform.`
              },
              {
                role: 'user',
                content: message,
              },
            ],
            temperature: 0.3, // Lower temperature for even more specific answers
          }),
        });

        const data: any = await response.json();

        if (response.ok && data.choices?.[0]?.message) {
          console.log(`[AI-CHAT] Successfully responded using model: ${model}`);
          return data.choices[0].message.content;
        }

        const errorMsg = data.error?.message || response.statusText;
        console.warn(`[AI-CHAT] Model ${model} failed: ${errorMsg}`);
        lastErrorDetails = `Model ${model}: ${errorMsg}`;
      } catch (error: any) {
        console.error(`[AI-CHAT] Exception with ${model}:`, error.message);
        lastErrorDetails = `Model ${model} Exception: ${error.message}`;
      }
    }

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      `AI Assistant unavailable. Last attempt details: ${lastErrorDetails}`
    );
  },
};
