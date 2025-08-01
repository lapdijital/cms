import { Request, Response, Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { generalLimiter } from '../middleware/rateLimiting';

const router = Router();

// Apply rate limiting to all API routes
router.use(generalLimiter);

// GET /api/user - Protected route example
router.get('/user', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({ 
    message: 'This is a protected route',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// GET /api/test - Public test route
router.get('/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'This is a public test route',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// GET /api/health - Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;
