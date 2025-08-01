import { PostStatus, PostType } from '@prisma/client';
import  }>;
}

//GET /posts/my - Get user's own posts (authenticated)sponse, Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { sanitizeInput } from '../middleware/validation.js';

const router = Router();

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Types
export interface PostCreateRequest {
  title: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  type?: PostType;
  status?: PostStatus;
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface PostResponse {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  status: PostStatus;
  type: PostType;
  metaTitle: string | null;
  metaDescription: string | null;
  featuredImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET /posts - List all posts (with pagination)
//GET /posts/my - Get user's own posts (authenticated)
router.get('/my',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const posts = await prisma.post.findMany({
        where: {
          authorId: req.user.userId
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          categories: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              comments: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      const formattedPosts = posts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        status: post.status,
        type: post.type,
        featuredImage: post.featuredImage,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author,
        categories: post.categories,
        tags: post.tags,
        commentsCount: post._count.comments,
        readingTime: 5, // Mock data for now
        views: Math.floor(Math.random() * 500), // Mock data for now
        seo: {
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
        }
      }));

      res.json({
        success: true,
        posts: formattedPosts
      });

    } catch (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }
);

// GET /posts - Get all posts (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as PostStatus;
    const type = req.query.type as PostType;
    const category = req.query.category as string;
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (category) {
      where.categories = {
        some: {
          slug: category
        }
      };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          categories: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.post.count({ where })
    ]);

    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      status: post.status,
      type: post.type,
      featuredImage: post.featuredImage,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
      categories: post.categories,
      tags: post.tags,
      commentsCount: post._count.comments,
      seo: {
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
      }
    }));

    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /posts/:id - Get single post
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /posts - Create new post
router.post('/', authenticate, sanitizeInput, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      title, 
      content, 
      excerpt, 
      slug, 
      type = PostType.POST, 
      status = PostStatus.DRAFT,
      featuredImage,
      categoryIds = [],
      tagIds = [],
      seo = {}
    } = req.body;

    if (!title) {
      return res.status(400).json({
        error: 'Title is required',
        code: 'MISSING_TITLE'
      });
    }

    const postSlug = slug || generateSlug(title);
    
    // Check if slug exists
    const existingPost = await prisma.post.findUnique({
      where: { slug: postSlug }
    });

    if (existingPost) {
      return res.status(400).json({
        error: 'Slug already exists',
        code: 'SLUG_EXISTS'
      });
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug: postSlug,
        content: content ? JSON.stringify(content) : null,
        excerpt,
        type,
        status,
        featuredImage,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
        authorId: req.user.userId,
        // SEO fields
        metaTitle: seo.metaTitle,
        metaDescription: seo.metaDescription,
        categories: {
          connect: categoryIds.map((id: string) => ({ id }))
        },
        tags: {
          connect: tagIds.map((id: string) => ({ id }))
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: post,
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// PUT /posts/:id - Update post
router.put('/:id', authenticate, sanitizeInput, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<PostCreateRequest> = req.body;
    
    const existingPost = await prisma.post.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({
        error: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }

    // Check if user owns the post or is admin
    if (existingPost.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    const updatePayload: any = { ...updateData };
    
    // Handle slug update
    if (updateData.title && !updateData.slug) {
      updatePayload.slug = generateSlug(updateData.title);
    }

    // Handle publishing status
    if (updateData.status === PostStatus.PUBLISHED && existingPost.status !== PostStatus.PUBLISHED) {
      updatePayload.publishedAt = new Date();
    }

    // Handle categories and tags
    if (updateData.categoryIds) {
      updatePayload.categories = {
        set: updateData.categoryIds.map(id => ({ id }))
      };
      delete updatePayload.categoryIds;
    }

    if (updateData.tagIds) {
      updatePayload.tags = {
        set: updateData.tagIds.map(id => ({ id }))
      };
      delete updatePayload.tagIds;
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updatePayload,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedPost,
      message: 'Post updated successfully'
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// DELETE /posts/:id - Delete post
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingPost = await prisma.post.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({
        error: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }

    // Check if user owns the post or is admin
    if (existingPost.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    await prisma.post.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

export default router;
