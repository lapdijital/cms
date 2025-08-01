import { NextFunction, Request, Response } from 'express';
import { loggerMethods } from '../lib/logger.js';
import { AuthUtils, JWTService } from '../utils/auth';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticate = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // First try to get token from cookie
    let token = req.cookies?.auth_token;
    
    // If no cookie, try Authorization header (for API clients)
    if (!token) {
      token = AuthUtils.extractTokenFromHeader(req.headers.authorization);
    }
    
    if (!token) {
      loggerMethods.logAuth('token_missing', undefined, req.ip, false, 'No auth token provided');
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    const decoded = JWTService.verifyToken(token);
    req.user = decoded;
    loggerMethods.logAuth('token_verified', decoded.id, req.ip, true);
    next();
  } catch (error) {
    loggerMethods.logAuth('token_invalid', undefined, req.ip, false, 'Invalid or expired token');
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID'
    });
  }
};

export const optionalAuth = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // First try to get token from cookie
    let token = req.cookies?.auth_token;
    
    // If no cookie, try Authorization header (for API clients)
    if (!token) {
      token = AuthUtils.extractTokenFromHeader(req.headers.authorization);
    }
    
    if (token) {
      const decoded = JWTService.verifyToken(token);
      req.user = decoded;
      loggerMethods.logAuth('optional_auth_success', decoded.id, req.ip, true);
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue without user (optional auth)
    loggerMethods.logAuth('optional_auth_failed', undefined, req.ip, false, 'Invalid token in optional auth');
    next();
  }
};
