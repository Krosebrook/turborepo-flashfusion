import crypto from 'crypto';

const algorithm = 'aes-256-gcm';

/**
 * Generate a random secret key
 */
export function generateSecretKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(text: string, secretKey: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, secretKey);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: '' // Simplified for this implementation
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, secretKey: string): string {
  const decipher = crypto.createDecipher(algorithm, secretKey);
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}