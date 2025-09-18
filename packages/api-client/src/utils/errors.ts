export class ApiError extends Error {
  public readonly status: number;
  public readonly originalError?: any;

  constructor(message: string, status: number = 500, originalError?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      stack: this.stack,
    };
  }
}