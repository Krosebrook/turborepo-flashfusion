// server/services/recommendationService.ts
// Emergency Recommendation Service with Multi-tier Fallback

import { createClient } from '@supabase/supabase-js';

interface Recommendation {
  id: string;
  title: string;
  type: 'guide' | 'tutorial' | 'social' | 'placeholder' | 'ai_generated';
  engagementScore?: number;
  description?: string;
  metadata?: any;
}

export class RecommendationService {
    private static supabase = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_ANON_KEY || ''
    );

    /**
   * Get recommendations with multi-tier fallback system
   */
    static async getRecommendations(userId: string): Promise<Recommendation[]> {
        try {
            // Tier 1: Try personalized AI recommendations
            const personalizedRecs = await this.getPersonalizedRecommendations(
                userId
            );
            if (personalizedRecs?.length > 0) {return personalizedRecs;}

            // Tier 2: Fallback to popular content
            const popularRecs = await this.getPopularContent();
            if (popularRecs?.length > 0) {return popularRecs;}

            // Tier 3: Last resort - default content
            return this.getDefaultContent();
        } catch (error) {
            console.error('Recommendation failure:', error);
            // Emergency fallback
            return this.getEmergencyContent();
        }
    }

    /**
   * Tier 1: Personalized AI-powered recommendations
   */
    private static async getPersonalizedRecommendations(
        userId: string
    ): Promise<Recommendation[]> {
        try {
            // Check if we have AI services available
            const { SecureAIService } = await import('./ai');
            const aiConfig = SecureAIService.validateConfiguration();

            if (!aiConfig.isValid) {
                console.log('AI services not available, falling back...');
                return [];
            }

            // Get user preferences
            const { data: userPrefs } = await this.supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (!userPrefs) {return [];}

            // Generate AI recommendations
            const prompt = `Generate 5 content recommendations for a user with these preferences: ${JSON.stringify(
                userPrefs
            )}`;
            const aiResponse = await SecureAIService.generateCompletion(
                prompt,
                undefined,
                {
                    maxTokens: 500,
                    temperature: 0.7
                }
            );

            // Parse AI response into recommendations
            try {
                const recommendations = JSON.parse(aiResponse.content);
                return recommendations.map((rec: any, index: number) => ({
                    id: `ai_${userId}_${Date.now()}_${index}`,
                    title: rec.title || `AI Recommendation ${index + 1}`,
                    type: 'ai_generated',
                    description: rec.description,
                    engagementScore: rec.score || 0.8
                }));
            } catch {
                return [];
            }
        } catch (error) {
            console.error('Personalized recommendations failed:', error);
            return [];
        }
    }

    /**
   * Tier 2: Popular content based on engagement
   */
    private static async getPopularContent(): Promise<Recommendation[]> {
        try {
            const { data: popularContent, error } = await this.supabase
                .from('content')
                .select('*')
                .eq('status', 'active')
                .order('engagement_score', { ascending: false })
                .limit(10);

            if (error) {throw error;}

            if (popularContent && popularContent.length > 0) {
                return popularContent.map((item) => ({
                    id: item.id,
                    title: item.title,
                    type: item.type || 'guide',
                    engagementScore: item.engagement_score,
                    description: item.description,
                    metadata: item.metadata
                }));
            }

            return [];
        } catch (error) {
            console.error('Popular content fetch failed:', error);
            return [];
        }
    }

    /**
   * Tier 3: Default static content
   */
    private static getDefaultContent(): Recommendation[] {
        return [
            {
                id: 'default1',
                title: 'Getting Started with FlashFusion',
                type: 'guide',
                description:
          'Learn the basics of our platform and get up to speed quickly.'
            },
            {
                id: 'default2',
                title: 'Popular Features You Should Try',
                type: 'tutorial',
                description: 'Explore the most-used features that our community loves.'
            },
            {
                id: 'default3',
                title: 'Community Tips & Tricks',
                type: 'social',
                description: 'Discover helpful tips from experienced users.'
            },
            {
                id: 'default4',
                title: 'AI-Powered Workflows',
                type: 'tutorial',
                description: 'Leverage our AI integrations to boost your productivity.'
            },
            {
                id: 'default5',
                title: 'Security Best Practices',
                type: 'guide',
                description: 'Keep your data safe with these essential security tips.'
            }
        ];
    }

    /**
   * Emergency content when everything fails
   */
    private static getEmergencyContent(): Recommendation[] {
        return [
            {
                id: 'emergency',
                title: 'Content Loading...',
                type: 'placeholder',
                description:
          'We\'re experiencing some issues. Please try again in a moment.'
            }
        ];
    }

    /**
   * Get trending content (additional recommendation source)
   */
    static async getTrendingContent(
        limit: number = 5
    ): Promise<Recommendation[]> {
        try {
            const { data: trending } = await this.supabase
                .from('content')
                .select('*')
                .eq('status', 'active')
                .gte(
                    'created_at',
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                )
                .order('view_count', { ascending: false })
                .limit(limit);

            if (trending && trending.length > 0) {
                return trending.map((item) => ({
                    id: item.id,
                    title: item.title,
                    type: item.type || 'guide',
                    engagementScore: item.engagement_score,
                    description: item.description
                }));
            }

            return [];
        } catch (error) {
            console.error('Trending content fetch failed:', error);
            return [];
        }
    }

    /**
   * Cache recommendations for offline support
   */
    static async cacheRecommendations(
        userId: string,
        recommendations: Recommendation[]
    ): Promise<void> {
        try {
            const cacheKey = `recommendations_${userId}`;
            const cacheData = {
                recommendations,
                timestamp: Date.now(),
                ttl: 3600000 // 1 hour
            };

            // In production, use Redis or similar
            // For now, we'll use in-memory cache
            if (typeof globalThis !== 'undefined') {
                (globalThis as any).recommendationCache =
          (globalThis as any).recommendationCache || {};
                (globalThis as any).recommendationCache[cacheKey] = cacheData;
            }
        } catch (error) {
            console.error('Failed to cache recommendations:', error);
        }
    }

    /**
   * Get cached recommendations
   */
    static async getCachedRecommendations(
        userId: string
    ): Promise<Recommendation[] | null> {
        try {
            const cacheKey = `recommendations_${userId}`;

            if (
                typeof globalThis !== 'undefined' &&
        (globalThis as any).recommendationCache
            ) {
                const cached = (globalThis as any).recommendationCache[cacheKey];

                if (cached && Date.now() - cached.timestamp < cached.ttl) {
                    return cached.recommendations;
                }
            }

            return null;
        } catch (error) {
            return null;
        }
    }
}

// Export convenience function matching the requirement
export const getRecommendations = async (
    userId: string
): Promise<Recommendation[]> => {
    return RecommendationService.getRecommendations(userId);
};

export default RecommendationService;