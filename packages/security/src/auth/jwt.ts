import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types';

/**
 * Generate a JWT token
 */
export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, secret: string, expiresIn: string = '24h'): string {
  if (!secret) {
    throw new Error('JWT secret is required');
  }
  
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string, secret: string): TokenPayload {
  if (!token || !secret) {
    throw new Error('Token and secret are required');
  }
  
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error: any) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}

/**
 * Extract token payload without verification (for debugging)
 */
export function extractTokenPayload(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = extractTokenPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }
  
  return Date.now() >= payload.exp * 1000;
}