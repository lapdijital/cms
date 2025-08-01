import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import logger, { loggerMethods } from '../lib/logger.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiting';
import { sanitizeInput, validateLogin } from '../middleware/validation';
import { UserLoginRequest, UserModel } from '../models/User';
import { JWTService } from '../utils/auth';

const router = Router();

// POST /auth/login
router.post('/login', 
  authLimiter,
  sanitizeInput, 
  validateLogin, 
  async (req: Request, res: Response) => {
  try {
    const { email, password }: UserLoginRequest = req.body;

    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      loggerMethods.logAuth('login_failed', undefined, req.ip, false, 'User not found');
      return res.status(401).json({ 
        error: 'Bu e-posta ile eşleşen bir hesap bulunamadı',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      loggerMethods.logAuth('login_failed', user.id, req.ip, false, 'Invalid password');
      return res.status(401).json({ 
        error: 'Hatalı şifre lütfen tekrar deneyin',
        code: 'INVALID_PASSWORD'
      });
    }

    // Generate JWT
    const token = JWTService.generateToken({
      userId: user.id,
      email: user.email
    });

    // Set session
    (req as any).session.userId = user.id;

    // Set httpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    const response = {
      success: true,
      user: UserModel.toResponse(user),
      message: 'Login successful'
    };

    // Log successful login
    loggerMethods.logAuth('login_success', user.id, req.ip, true);
    logger.info('User logged in successfully', { 
      userId: user.id, 
      email: user.email,
      ip: req.ip 
    });

    res.json(response);
  } catch (error) {
    loggerMethods.logError(error as Error, { action: 'login', email: req.body.email });
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /auth/logout
router.post('/logout', /* generalLimiter, */ (req: Request, res: Response) => {
  const userId = (req as any).session?.userId;
  
  // Clear the httpOnly cookie
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  (req as any).session.destroy((err: any) => {
    if (err) {
      loggerMethods.logAuth('logout_failed', userId, req.ip, false, 'Session destroy error');
      return res.status(500).json({ 
        error: 'Could not log out',
        code: 'LOGOUT_FAILED'
      });
    }
    
    loggerMethods.logAuth('logout_success', userId, req.ip, true);
    logger.info('User logged out successfully', { userId, ip: req.ip });
    
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });
});

// GET /auth/me - Get current user info
router.get('/me', /* generalLimiter, */ authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user: UserModel.toResponse(user)
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /auth/refresh - Refresh token
router.post('/refresh', /* generalLimiter, */ authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const newToken = JWTService.generateToken({
      userId: req.user.userId,
      email: req.user.email
    });

    // Set new httpOnly cookie
    res.cookie('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

export default router;
