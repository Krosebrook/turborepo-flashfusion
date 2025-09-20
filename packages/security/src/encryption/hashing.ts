import crypto from 'crypto';

/**
 * Hash data using SHA-256
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify hash matches data
 */
export function verifyHash(data: string, hash: string): boolean {
  const computedHash = hashData(data);
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
}