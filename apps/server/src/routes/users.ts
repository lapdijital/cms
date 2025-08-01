import bcrypt from 'bcryptjs';
import { Response, Router } from 'express';
import logger, { loggerMethods } from '../lib/logger.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { generalLimiter } from '../middleware/rateLimiting';
import { sanitizeInput } from '../middleware/validation';
import { SiteModel } from '../models/Site';
import { UserCreateRequest, UserModel } from '../models/User';

const router = Router();

// POST /users - Create new user (Admin only)
router.post('/',
    generalLimiter,
    authenticate,
    sanitizeInput,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            // Check if user is admin
            const currentUser = await UserModel.findById(req.user.userId);
            if (!currentUser || currentUser.role !== 'ADMIN') {
                return res.status(403).json({
                    error: 'Unauthorized - Admin access required',
                    code: 'FORBIDDEN'
                });
            }

            const {
                name,
                email,
                password,
                role,
                bio,
                isActive,
                siteName
            }: UserCreateRequest & { siteName?: string } = req.body;

            // Validate required fields
            if (!name || !email || !password) {
                return res.status(400).json({
                    error: 'Name, email and password are required',
                    code: 'MISSING_FIELDS'
                });
            }

            // Check if email already exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    error: 'Bu e-posta adresi ile zaten bir hesap bulunmaktadır',
                    code: 'EMAIL_EXISTS'
                });
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create user
            const newUser = await UserModel.create({
                name,
                email,
                password: hashedPassword,
                role: role || 'USER',
                bio,
                isActive: isActive ?? true
            });

            if (!newUser) {
                return res.status(500).json({
                    error: 'User creation failed',
                    code: 'USER_CREATION_FAILED'
                });
            }

            // Create site if siteName provided
            let site = null;
            if (siteName && siteName.trim()) {
                site = await SiteModel.create({
                    name: siteName.trim(),
                    userId: newUser.id,
                    description: `${newUser.name} kişisinin sitesi`
                });

                if (!site) {
                    loggerMethods.logError(new Error('Site creation failed'), {
                        action: 'create_user_site',
                        userId: newUser.id,
                        siteName
                    });
                    // Don't fail user creation if site creation fails
                    logger.warn('Site creation failed for user', {
                        userId: newUser.id,
                        siteName,
                        userEmail: newUser.email
                    });
                }
            }

            // Log successful user creation
            loggerMethods.logAuth('user_created', newUser.id, req.ip, true, `Created by admin: ${currentUser.id}`);
            logger.info('User created successfully', {
                userId: newUser.id,
                email: newUser.email,
                role: newUser.role,
                createdBy: currentUser.id,
                siteName: site?.name,
                siteId: site?.id,
                ip: req.ip
            });

            const response = {
                success: true,
                user: UserModel.toResponse(newUser),
                site: site ? SiteModel.toResponse(site) : null,
                message: 'User created successfully'
            };

            res.status(201).json(response);
        } catch (error) {
            loggerMethods.logError(error as Error, {
                action: 'create_user',
                email: req.body.email,
                requestUserId: req.user.userId
            });
            console.error('Create user error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    });

// GET /users - Get all users (Admin only)
router.get('/',
    generalLimiter,
    authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            // Check if user is admin
            const currentUser = await UserModel.findById(req.user.userId);
            if (!currentUser || currentUser.role !== 'ADMIN') {
                return res.status(403).json({
                    error: 'Unauthorized - Admin access required',
                    code: 'FORBIDDEN'
                });
            }

            // Get pagination params
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            // TODO: Implement pagination in UserModel
            // For now, get all users (in production, implement proper pagination)

            const users = await UserModel.findAll();

            const response = {
                success: true,
                users: users.map((user: any) => UserModel.toResponse(user)),
                pagination: {
                    page,
                    limit,
                    total: users.length,
                    pages: Math.ceil(users.length / limit)
                }
            };

            res.json(response);
        } catch (error) {
            loggerMethods.logError(error as Error, {
                action: 'get_users',
                requestUserId: req.user.userId
            });
            console.error('Get users error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    });

// GET /users/:id - Get user by ID (Admin only)
router.get('/:id',
    generalLimiter,
    authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            // Check if user is admin
            const currentUser = await UserModel.findById(req.user.userId);
            if (!currentUser || currentUser.role !== 'ADMIN') {
                return res.status(403).json({
                    error: 'Unauthorized - Admin access required',
                    code: 'FORBIDDEN'
                });
            }

            const userId = req.params.id;
            const user = await UserModel.findById(userId);

            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Get user's sites
            const sites = await SiteModel.findByUserId(userId);

            const response = {
                success: true,
                user: UserModel.toResponse(user),
                sites: sites.map(site => SiteModel.toResponse(site))
            };

            res.json(response);
        } catch (error) {
            loggerMethods.logError(error as Error, {
                action: 'get_user_by_id',
                userId: req.params.id,
                requestUserId: req.user.userId
            });
            console.error('Get user error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    });

// PUT /users/update/password - Update user password
router.put("/update/password", generalLimiter, authenticate, sanitizeInput, async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    try {
        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Current password and new password are required',
                code: 'MISSING_FIELDS'
            });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long',
                code: 'WEAK_PASSWORD'
            });
        }

        const currentUser = await UserModel.findById(req.user.userId);

        if (!currentUser) {
            loggerMethods.logAuth('user_not_found', req.user.userId, req.ip, false, 'User not found for password update');

            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
        if (!isCurrentPasswordValid) {
            loggerMethods.logAuth('invalid_current_password', req.user.userId, req.ip, false, 'Invalid current password for password update');
            
            return res.status(400).json({
                error: 'Current password is incorrect',
                code: 'INVALID_CURRENT_PASSWORD'
            });
        }

        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(newPassword, currentUser.password);
        if (isSamePassword) {
            return res.status(400).json({
                error: 'New password must be different from current password',
                code: 'SAME_PASSWORD'
            });
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        const result = await UserModel.update(req.user.userId, {
            password: hashedPassword
        });

        if (!result) {
            loggerMethods.logAuth('user_update_failed', req.user.userId, req.ip, false, 'Failed to update user password');
            return res.status(500).json({
                error: 'Failed to update password',
                code: 'UPDATE_FAILED'
            });
        }

        // Log successful password update
        loggerMethods.logAuth('password_updated', req.user.userId, req.ip, true, 'Password updated successfully');
        logger.info('User password updated', {
            userId: req.user.userId,
            email: currentUser.email,
            ip: req.ip
        });

        res.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        loggerMethods.logError(error as Error, {
            action: 'update_password',
            requestUserId: req.user.userId
        });
        console.error('Update password error:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
});

// PUT /users/regenerate-api-key - Regenerate user's site API key
router.put("/regenerate-api-key", generalLimiter, authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUser = await UserModel.findById(req.user.userId);

        if (!currentUser) {
            loggerMethods.logAuth('user_not_found', req.user.userId, req.ip, false, 'User not found for API key regeneration');
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Check if user has a site
        const userSites = await SiteModel.findByUserId(req.user.userId);
        if (!userSites || userSites.length === 0) {
            return res.status(404).json({
                error: 'Site not found for this user',
                code: 'SITE_NOT_FOUND'
            });
        }

        const site = userSites[0]; // Get the first site (assuming one site per user)

        // Generate new API key
        const newApiKey = require('crypto').randomBytes(32).toString('hex');

        // Update site with new API key
        const updatedSite = await SiteModel.update(site.id, {
            apiKey: newApiKey
        });

        if (!updatedSite) {
            loggerMethods.logAuth('api_key_regeneration_failed', req.user.userId, req.ip, false, 'Failed to regenerate API key');
            return res.status(500).json({
                error: 'Failed to regenerate API key',
                code: 'REGENERATION_FAILED'
            });
        }

        // Log successful API key regeneration
        loggerMethods.logAuth('api_key_regenerated', req.user.userId, req.ip, true, 'API key regenerated successfully');
        logger.info('API key regenerated', {
            userId: req.user.userId,
            siteId: site.id,
            email: currentUser.email,
            ip: req.ip
        });

        res.json({
            success: true,
            message: 'API key regenerated successfully',
            newApiKey: newApiKey
        });

    } catch (error) {
        loggerMethods.logError(error as Error, {
            action: 'regenerate_api_key',
            requestUserId: req.user.userId
        });
        console.error('Regenerate API key error:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
});

// PUT /users/update-site - Update user's site information
router.put("/update-site", generalLimiter, authenticate, sanitizeInput, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, domain, description } = req.body;

        // Validation
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                error: 'Site name is required',
                code: 'MISSING_SITE_NAME'
            });
        }

        const currentUser = await UserModel.findById(req.user.userId);

        if (!currentUser) {
            loggerMethods.logAuth('user_not_found', req.user.userId, req.ip, false, 'User not found for site update');
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Check if user has a site
        const userSites = await SiteModel.findByUserId(req.user.userId);
        if (!userSites || userSites.length === 0) {
            return res.status(404).json({
                error: 'Site not found for this user',
                code: 'SITE_NOT_FOUND'
            });
        }

        const site = userSites[0]; // Get the first site (assuming one site per user)

        // Update site information
        const updatedSite = await SiteModel.update(site.id, {
            name: name.trim(),
            domain: domain?.trim() || null,
            description: description?.trim() || null
        });

        if (!updatedSite) {
            loggerMethods.logAuth('site_update_failed', req.user.userId, req.ip, false, 'Failed to update site information');
            return res.status(500).json({
                error: 'Failed to update site information',
                code: 'UPDATE_FAILED'
            });
        }

        // Log successful site update
        loggerMethods.logAuth('site_updated', req.user.userId, req.ip, true, 'Site information updated successfully');
        logger.info('Site information updated', {
            userId: req.user.userId,
            siteId: site.id,
            email: currentUser.email,
            siteName: name,
            domain: domain,
            ip: req.ip
        });

        res.json({
            success: true,
            message: 'Site information updated successfully',
            site: SiteModel.toResponse(updatedSite)
        });

    } catch (error) {
        loggerMethods.logError(error as Error, {
            action: 'update_site',
            requestUserId: req.user.userId
        });
        console.error('Update site error:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }
});

// GET /users/activities - Get recent activities for current user
router.get('/activities',
    generalLimiter,
    authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            // Bu endpoint kullanıcının son aktivitelerini döndürür
            // Şimdilik basit bir mock response döndürelim, ileride gerçek veriler gelecek
            const activities = [
                {
                    id: 1,
                    type: "post",
                    message: "Yeni yazı taslağı oluşturuldu",
                    time: "5 dakika önce",
                    action: "view",
                    href: "/posts",
                    timestamp: new Date(Date.now() - 5 * 60 * 1000)
                },
                {
                    id: 2,
                    type: "settings",
                    message: "Site ayarları güncellendi",
                    time: "2 saat önce",
                    action: "view",
                    href: "/site-settings",
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
                },
                {
                    id: 3,
                    type: "post",
                    message: "Blog yazısı yayınlandı",
                    time: "1 gün önce",
                    action: "view",
                    href: "/posts",
                    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
                },
                {
                    id: 4,
                    type: "profile",
                    message: "Profil bilgileri güncellendi",
                    time: "3 gün önce",
                    action: "view",
                    href: "/site-settings",
                    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                }
            ];

            res.json({
                success: true,
                activities: activities
            });

        } catch (error) {
            loggerMethods.logError(error as Error, {
                action: 'get_activities',
                requestUserId: req.user.userId
            });
        }
    }
);

// PUT /users/:id - Update user (Admin only)
router.put('/:id',
    generalLimiter,
    authenticate,
    sanitizeInput,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            // Check if user is admin
            const currentUser = await UserModel.findById(req.user.userId);
            if (!currentUser || currentUser.role !== 'ADMIN') {
                return res.status(403).json({
                    error: 'Unauthorized - Admin access required',
                    code: 'FORBIDDEN'
                });
            }

            const userId = req.params.id;
            const {
                name,
                email,
                role,
                bio,
                isActive
            } = req.body;

            // Check if user exists
            const existingUser = await UserModel.findById(userId);
            if (!existingUser) {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'NOT_FOUND'
                });
            }

            // If email is being changed, check if it already exists
            if (email && email !== existingUser.email) {
                const emailExists = await UserModel.findByEmail(email);
                if (emailExists) {
                    return res.status(409).json({
                        error: 'Bu e-posta adresi ile zaten bir hesap bulunmaktadır',
                        code: 'EMAIL_EXISTS'
                    });
                }
            }

            // Update user
            const updatedUser = await UserModel.update(userId, {
                name,
                email,
                role,
                bio,
                isActive
            });

            if (!updatedUser) {
                return res.status(500).json({
                    error: 'Failed to update user',
                    code: 'UPDATE_FAILED'
                });
            }

            res.json({
                success: true,
                user: UserModel.toResponse(updatedUser),
                message: 'User updated successfully'
            });

            logger.info('User updated', {
                action: 'update_user',
                adminUserId: req.user.userId,
                updatedUserId: userId,
                changes: { name, email, role, bio, isActive }
            });

        } catch (error) {
            loggerMethods.logError(error as Error, {
                action: 'update_user',
                requestUserId: req.user.userId,
                targetUserId: req.params.id
            });
            console.error('Update user error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    });

// DELETE /users/:id - Delete user (Admin only)
router.delete('/:id',
    generalLimiter,
    authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            // Check if user is admin
            const currentUser = await UserModel.findById(req.user.userId);
            if (!currentUser || currentUser.role !== 'ADMIN') {
                return res.status(403).json({
                    error: 'Unauthorized - Admin access required',
                    code: 'FORBIDDEN'
                });
            }

            const userId = req.params.id;

            // Check if user exists
            const existingUser = await UserModel.findById(userId);
            if (!existingUser) {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'NOT_FOUND'
                });
            }

            // Prevent admin from deleting themselves
            if (userId === req.user.userId) {
                return res.status(400).json({
                    error: 'Cannot delete your own account',
                    code: 'SELF_DELETE_FORBIDDEN'
                });
            }

            // Delete user
            const deleted = await UserModel.delete(userId);
            if (!deleted) {
                return res.status(500).json({
                    error: 'Failed to delete user',
                    code: 'DELETE_FAILED'
                });
            }

            res.json({
                success: true,
                message: 'User deleted successfully'
            });

            logger.info('User deleted', {
                action: 'delete_user',
                adminUserId: req.user.userId,
                deletedUserId: userId,
                deletedUserEmail: existingUser.email
            });

        } catch (error) {
            loggerMethods.logError(error as Error, {
                action: 'delete_user',
                requestUserId: req.user.userId,
                targetUserId: req.params.id
            });
            console.error('Delete user error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    });

export default router;
