import crypto from 'crypto';

/**
 * Generate a secure API key
 */
export function generateApiKey(length: number = 32): string {
  const prefix = 'ff-';
  const randomBytes = crypto.randomBytes(length);
  const key = randomBytes.toString('hex');
  return `${prefix}${key}`;
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!apiKey) {
    errors.push('API key is required');
    return { isValid: false, errors };
  }
  
  if (!apiKey.startsWith('ff-')) {
    errors.push('API key must start with "ff-" prefix');
  }
  
  if (apiKey.length < 20) {
    errors.push('API key is too short');
  }
  
  if (apiKey.length > 200) {
    errors.push('API key is too long');
  }
  
  if (!/^ff-[a-f0-9]+$/.test(apiKey)) {
    errors.push('API key contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Hash API key for storage
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  hash.update(apiKey);
  return hash.digest('hex');
}

/**
 * Generate API key with metadata
 */
export function generateApiKeyWithMetadata(name: string, permissions: string[] = []): {
  apiKey: string;
  hash: string;
  metadata: {
    name: string;
    permissions: string[];
    createdAt: string;
    lastUsed?: string;
  };
} {
  const apiKey = generateApiKey();
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  return {
    apiKey,
    hash,
    metadata: {
      name,
      permissions,
      createdAt: new Date().toISOString()
    }
  };
}