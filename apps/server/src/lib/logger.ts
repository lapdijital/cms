import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Custom format for console logs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Custom format for file logs
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transports array
const transports: winston.transport[] = [];

// Console transport (only in development)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// File transports
const logsDir = path.join(process.cwd(), 'logs');

// Error logs
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
  })
);

// Combined logs
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true,
  })
);

// HTTP logs (for access logging)
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'access-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '7d',
    zippedArchive: true,
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format: fileFormat,
  transports,
  exitOnError: false,
});

// Stream for Morgan HTTP logging
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Custom logging methods
export const loggerMethods = {
  // Request logging
  logRequest: (req: any, res: any, responseTime?: number) => {
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    };
    logger.http('HTTP Request', logData);
  },

  // Error logging with context
  logError: (error: Error, context?: any) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  },

  // Database operation logging
  logDatabase: (operation: string, table: string, duration?: number, error?: Error) => {
    if (error) {
      logger.error('Database Error', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.debug('Database Operation', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Authentication logging
  logAuth: (action: string, userId?: string, ip?: string, success: boolean = true, reason?: string) => {
    const level = success ? 'info' : 'warn';
    logger[level]('Authentication Event', {
      action,
      userId,
      ip,
      success,
      reason,
      timestamp: new Date().toISOString(),
    });
  },

  // Security logging
  logSecurity: (event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium') => {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    logger[level]('Security Event', {
      event,
      severity,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  // Performance logging
  logPerformance: (operation: string, duration: number, threshold: number = 1000) => {
    const level = duration > threshold ? 'warn' : 'info';
    logger[level]('Performance Metric', {
      operation,
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
      slow: duration > threshold,
      timestamp: new Date().toISOString(),
    });
  },
};

export default logger;
