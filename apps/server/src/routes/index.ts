import { Router } from 'express';
import apiRoutes from './api';
import authRoutes from './auth';
import categoriesRoutes from './categories';
import dashboardRoutes from './dashboard';
import postsRoutes from './posts';
import sdkRoutes from './sdk';
import tagsRoutes from './tags';
import uploadRoutes from './upload';
import usersRoutes from './users';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/api', apiRoutes);
router.use('/api/posts', postsRoutes);
router.use('/posts', postsRoutes); // Shorter route for users
router.use('/api/categories', categoriesRoutes);
router.use('/api/tags', tagsRoutes);
router.use('/api/dashboard', dashboardRoutes);
router.use('/api/users', usersRoutes);
router.use('/users', usersRoutes); // Shorter route
router.use('/api/upload', uploadRoutes);
router.use('/api/sdk', sdkRoutes);

// Root route
router.get('/', (req, res) => {
  res.json({ 
    message: 'Lap CMS API Server',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /auth/login',
        logout: 'POST /auth/logout',
        me: 'GET /auth/me (requires auth)',
        refresh: 'POST /auth/refresh (requires auth)'
      },
      api: {
        user: 'GET /api/user (requires auth)',
        test: 'GET /api/test',
        health: 'GET /api/health'
      },
      posts: {
        list: 'GET /api/posts',
        create: 'POST /api/posts (requires auth)',
        get: 'GET /api/posts/:id',
        update: 'PUT /api/posts/:id (requires auth)',
        delete: 'DELETE /api/posts/:id (requires auth)',
        publish: 'PUT /api/posts/:id/publish (requires auth)',
        unpublish: 'PUT /api/posts/:id/unpublish (requires auth)'
      },
      categories: {
        list: 'GET /api/categories',
        create: 'POST /api/categories (requires auth)',
        get: 'GET /api/categories/:id',
        update: 'PUT /api/categories/:id (requires auth)',
        delete: 'DELETE /api/categories/:id (requires auth)'
      },
      tags: {
        list: 'GET /api/tags',
        create: 'POST /api/tags (requires auth)',
        get: 'GET /api/tags/:id',
        update: 'PUT /api/tags/:id (requires auth)',
        delete: 'DELETE /api/tags/:id (requires auth)'
      },
      dashboard: {
        stats: 'GET /api/dashboard/stats (requires auth)',
        recentActivity: 'GET /api/dashboard/recent-activity (requires auth)',
        quickStats: 'GET /api/dashboard/quick-stats (requires auth)'
      },
      users: {
        list: 'GET /api/users (requires admin)',
        create: 'POST /api/users (requires admin)',
        get: 'GET /api/users/:id (requires admin)'
      }
    },
    documentation: 'https://github.com/your-repo/lap-cms'
  });
});

export default router;
