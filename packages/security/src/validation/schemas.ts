import { z } from 'zod';
import { ValidationResult } from '../types';

export type ValidationSchema = z.ZodSchema<any>;

/**
 * Create a validator from a Zod schema
 */
export function createValidator(schema: ValidationSchema) {
  return (data: any): ValidationResult => {
    try {
      const sanitized = schema.parse(data);
      return {
        isValid: true,
        errors: [],
        sanitized
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return {
        isValid: false,
        errors: ['Unknown validation error']
      };
    }
  };
}