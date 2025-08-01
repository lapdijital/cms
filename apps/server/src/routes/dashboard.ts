import { PostStatus } from '@prisma/client';
import { Response, Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /dashboard/stats - Dashboard istatistikleri
router.get('/stats', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Paralel olarak tüm istatistikleri çek
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalCategories,
      totalTags,
      totalUsers,
      recentPosts,
      postsByCategory,
      postsByMonth
    ] = await Promise.all([
      // Toplam yazı sayısı
      prisma.post.count(),
      
      // Yayınlanmış yazılar
      prisma.post.count({
        where: { status: PostStatus.PUBLISHED }
      }),
      
      // Taslak yazılar
      prisma.post.count({
        where: { status: PostStatus.DRAFT }
      }),
      
      // Toplam kategori sayısı
      prisma.category.count(),
      
      // Toplam etiket sayısı
      prisma.tag.count(),
      
      // Toplam kullanıcı sayısı
      prisma.user.count(),
      
      // Son 5 yazı
      prisma.post.findMany({
        take: 5,
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          categories: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Kategoriye göre yazı dağılımı
      prisma.category.findMany({
        include: {
          _count: {
            select: {
              posts: true
            }
          }
        },
        orderBy: {
          posts: {
            _count: 'desc'
          }
        },
        take: 5
      }),
      
      // Son 6 aydaki yazı sayısı (aylık dağılım)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as count
        FROM "posts"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `
    ]);

    const stats = {
      overview: {
        totalPosts,
        publishedPosts,
        draftPosts,
        totalCategories,
        totalTags,
        totalUsers
      },
      recentActivity: {
        recentPosts: recentPosts.map(post => ({
          id: post.id,
          title: post.title,
          status: post.status,
          author: post.author.name || post.author.id,
          categories: post.categories.map(cat => cat.name),
          createdAt: post.createdAt
        }))
      },
      analytics: {
        postsByCategory: postsByCategory.map(category => ({
          name: category.name,
          count: category._count.posts,
          color: category.color
        })),
        postsByMonth
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /dashboard/recent-activity - Son aktiviteler
router.get('/recent-activity', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const [recentPosts, recentComments] = await Promise.all([
      // Son yazılar
      prisma.post.findMany({
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Son yorumlar
      prisma.comment.findMany({
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          post: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Aktiviteleri birleştir ve tarihte sırala
    const activities = [
      ...recentPosts.map(post => ({
        type: 'post',
        action: 'created',
        title: post.title,
        author: post.author.name || post.author.id,
        createdAt: post.createdAt,
        data: {
          id: post.id,
          status: post.status
        }
      })),
      ...recentComments.map(comment => ({
        type: 'comment',
        action: 'created',
        title: `Comment on "${comment.post.title}"`,
        author: comment.author.name || comment.author.id,
        createdAt: comment.createdAt,
        data: {
          id: comment.id,
          postId: comment.post.id,
          content: comment.content.substring(0, 100) + '...'
        }
      }))
    ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /dashboard/quick-stats - Hızlı istatistikler (widget'lar için)
router.get('/quick-stats', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      postsThisWeek,
      postsThisMonth,
      commentsThisWeek,
      commentsThisMonth
    ] = await Promise.all([
      prisma.post.count({
        where: {
          createdAt: {
            gte: weekAgo
          }
        }
      }),
      prisma.post.count({
        where: {
          createdAt: {
            gte: monthAgo
          }
        }
      }),
      prisma.comment.count({
        where: {
          createdAt: {
            gte: weekAgo
          }
        }
      }),
      prisma.comment.count({
        where: {
          createdAt: {
            gte: monthAgo
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        postsThisWeek,
        postsThisMonth,
        commentsThisWeek,
        commentsThisMonth
      }
    });
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

export default router;
