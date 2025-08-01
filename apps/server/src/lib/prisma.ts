import { PrismaClient } from '@prisma/client';
import logger, { loggerMethods } from './logger.js';

// Singleton pattern for Prisma Client
declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Add logging middleware
prisma.$use(async (params, next) => {
  const before = Date.now();
  
  try {
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;
    
    loggerMethods.logDatabase(
      `${params.action} ${params.model || 'unknown'}`,
      params.model || 'unknown',
      duration
    );
    
    return result;
  } catch (error) {
    const after = Date.now();
    const duration = after - before;
    
    loggerMethods.logDatabase(
      `${params.action} ${params.model || 'unknown'}`,
      params.model || 'unknown',
      duration,
      error as Error
    );
    
    throw error;
  }
});

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

export { prisma };

// Graceful shutdown
process.on('beforeExit', async () => {
  logger.info('Disconnecting from database...');
  await prisma.$disconnect();
  logger.info('Database disconnected successfully');
});
