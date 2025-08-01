// TEMPORARILY DISABLED: express-rate-limit has IPv6 compatibility issues
// import rateLimit from 'express-rate-limit';
import type { NextFunction, Request, Response } from 'express';

// Dummy middleware that does nothing - rate limiting temporarily disabled
const createDummyLimiter = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};

// General rate limiting for all API endpoints (DISABLED)
export const generalLimiter = createDummyLimiter();

// Strict rate limiting for authentication endpoints (DISABLED)
export const authLimiter = createDummyLimiter();

// Moderate rate limiting for registration (DISABLED)
export const registerLimiter = createDummyLimiter();

// Very strict rate limiting for password reset (DISABLED)
export const passwordResetLimiter = createDummyLimiter();
