import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import logger from './src/lib/logger.js';
import { initializeBucket } from './src/lib/minio.js';
import { errorHandler, notFound, requestLogger } from './src/middleware/common';
import { generalLimiter } from './src/middleware/rateLimiting';
import { sanitizeInput } from './src/middleware/validation';
import routes from './src/routes';

// Load environment variables
dotenv.config({
  quiet: true, 
});


const app = express();
const PORT = process.env.PORT || 3003;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for development
  crossOriginResourcePolicy: false // Disable for SDK access
}));

// Rate limiting
app.use('/api/', generalLimiter);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow localhost and development origins
    if (!origin || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') ||
        origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for SDK usage - can be restricted later
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb for security
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Input sanitization
app.use(sanitizeInput);

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger);
}

// Session middleware
app.use(session({
  secret: process.env.AUTH_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  },
  name: 'lap-cms-session' // Custom session name
}));

// Health check endpoint (before other routes)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Special CORS for SDK endpoints (before main routes)
app.use('/api/sdk', cors({
  origin: '*', // Allow all origins for SDK
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'Origin', 'Referer'],
  credentials: false // SDK doesn't need credentials
}));

// Mount all routes
app.use('/', routes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  logger.info('🚀 Lap CMS Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
  
  // Initialize Minio bucket
  await initializeBucket();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
