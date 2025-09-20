import bcrypt from 'bcryptjs';

const DEFAULT_SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string, saltRounds: number = DEFAULT_SALT_ROUNDS): Promise<string> {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }
  
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}