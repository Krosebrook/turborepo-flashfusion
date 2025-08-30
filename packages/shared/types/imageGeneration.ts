// TypeScript interfaces for Image Generation API

export interface ImageGenerationRequest {
  positivePrompt: string;
  model?: string;
  width?: number;
  height?: number;
  numberResults?: number;
  negativePrompt?: string;
  steps?: number;
  cfgScale?: number;
}

export interface ImageGenerationResponse {
  success: boolean;
  data?: {
    imageURL: string;
    imageUUID: string;
    prompt: string;
    seed: number;
    NSFWContent: boolean;
    cost: number;
    model: string;
    dimensions: {
      width: number;
      height: number;
    };
    parameters: {
      steps: number;
      cfgScale: number;
    };
  };
  metadata?: {
    generatedAt: string;
    userId: string;
    requestsRemaining: number;
  };
  error?: string;
  details?: string;
  violatingTerms?: string[];
  retryAfter?: string;
  timeout?: number;
  timestamp?: string;
}

export interface GenerationStats {
  total_images: number;
  images_today: number;
  images_this_week: number;
  total_cost: number;
  avg_generation_time: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: string;
}

export interface ContentViolation {
  id: string;
  content_type: string;
  content: string;
  violation_terms: string[];
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

// Available models
export const AVAILABLE_MODELS = {
  'runware:100@1': 'Runware Base Model (Fast)',
  'runware:101@1': 'Runware Enhanced Model',
  'runware:500@1': 'Runware Premium Model',
} as const;

export type ModelType = keyof typeof AVAILABLE_MODELS;

// Preset dimensions
export const PRESET_DIMENSIONS = {
  square: { width: 1024, height: 1024, label: 'Square (1:1)' },
  portrait: { width: 768, height: 1024, label: 'Portrait (3:4)' },
  landscape: { width: 1024, height: 768, label: 'Landscape (4:3)' },
  widescreen: { width: 1344, height: 768, label: 'Widescreen (16:9)' },
} as const;

export type DimensionPreset = keyof typeof PRESET_DIMENSIONS;

// Quality presets
export const QUALITY_PRESETS = {
  fast: { steps: 4, cfgScale: 1, label: 'Fast (4 steps)' },
  balanced: { steps: 8, cfgScale: 2, label: 'Balanced (8 steps)' },
  quality: { steps: 16, cfgScale: 3, label: 'High Quality (16 steps)' },
  premium: { steps: 32, cfgScale: 4, label: 'Premium (32 steps)' },
} as const;

export type QualityPreset = keyof typeof QUALITY_PRESETS;

// API Error types
export interface APIError extends Error {
  status?: number;
  code?: string;
  retryAfter?: number;
}

// Image generation client class
export class ImageGenerationClient {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/functions/v1/generate-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.error || 'Image generation failed') as APIError;
      error.status = response.status;
      error.code = data.errorCode;
      error.retryAfter = data.retryAfter ? parseInt(data.retryAfter) : undefined;
      throw error;
    }

    return data;
  }

  async getGenerationStats(): Promise<GenerationStats> {
    const response = await fetch(`${this.baseUrl}/rest/v1/rpc/get_user_generation_stats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        'apikey': this.authToken,
      },
      body: JSON.stringify({ user_uuid: 'auth.uid()' }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch generation stats');
    }

    return response.json();
  }

  async getRateLimitInfo(): Promise<RateLimitInfo> {
    const response = await fetch(`${this.baseUrl}/rest/v1/api_rate_limits?select=*&endpoint=eq.generate-image`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'apikey': this.authToken,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch rate limit info');
    }

    const data = await response.json();
    const rateData = data[0];
    
    return {
      limit: 50,
      remaining: Math.max(0, 50 - (rateData?.request_count || 0)),
      resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }
}

// Utility functions
export function validatePrompt(prompt: string): string[] {
  const errors: string[] = [];
  
  if (!prompt || prompt.trim().length === 0) {
    errors.push('Prompt cannot be empty');
  }
  
  if (prompt.length > 1000) {
    errors.push('Prompt cannot exceed 1000 characters');
  }
  
  const blockedTerms = [
    'nude', 'nsfw', 'explicit', 'pornographic', 'sexual',
    'naked', 'erotic', 'adult', 'xxx', 'porn',
    'violence', 'blood', 'gore', 'death', 'killing',
    'hate', 'racist', 'terrorism', 'drugs', 'illegal'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  const violatingTerms = blockedTerms.filter(term => lowerPrompt.includes(term));
  
  if (violatingTerms.length > 0) {
    errors.push(`Content policy violation: ${violatingTerms.join(', ')}`);
  }
  
  return errors;
}

export function validateDimensions(width: number, height: number): string[] {
  const errors: string[] = [];
  
  if (width < 256 || width > 2048) {
    errors.push('Width must be between 256 and 2048 pixels');
  }
  
  if (height < 256 || height > 2048) {
    errors.push('Height must be between 256 and 2048 pixels');
  }
  
  // Ensure dimensions are multiples of 8 for optimal generation
  if (width % 8 !== 0) {
    errors.push('Width should be a multiple of 8');
  }
  
  if (height % 8 !== 0) {
    errors.push('Height should be a multiple of 8');
  }
  
  return errors;
}

export function estimateCost(request: ImageGenerationRequest): number {
  const basePixels = 1024 * 1024; // 1 megapixel baseline
  const actualPixels = (request.width || 1024) * (request.height || 1024);
  const pixelMultiplier = actualPixels / basePixels;
  
  const stepMultiplier = (request.steps || 4) / 4; // 4 steps baseline
  const resultMultiplier = request.numberResults || 1;
  
  const baseCost = 0.01; // Base cost per image
  
  return baseCost * pixelMultiplier * stepMultiplier * resultMultiplier;
}