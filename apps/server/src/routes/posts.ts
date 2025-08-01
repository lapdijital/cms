import { PostStatus, PostType } from '@prisma/client';
import { Response, Router } from 'express';
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

// GET /posts/my - Get user's own posts (authenticated)
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
        content: post.content ? JSON.parse(post.content) : null, // Content'i dahil et
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
          keywords: post.metaKeywords,
          canonicalUrl: post.canonicalUrl,
          ogTitle: post.ogTitle,
          ogDescription: post.ogDescription,
          ogImage: post.ogImage,
          twitterTitle: post.twitterTitle,
          twitterDescription: post.twitterDescription,
          noIndex: post.noIndex,
          noFollow: post.noFollow,
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

// POST /posts - Create new post
router.post('/', 
  authenticate, 
  sanitizeInput, 
  async (req: AuthenticatedRequest, res: Response) => {
    console.log('POST /posts endpoint hit!');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    try {
      const { 
        title, 
        content, 
        excerpt, 
        slug, 
        type = PostType.POST, 
        status = PostStatus.DRAFT,
        featuredImage,
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
          metaKeywords: seo.keywords,
          canonicalUrl: seo.canonicalUrl,
          ogTitle: seo.ogTitle,
          ogDescription: seo.ogDescription,
          ogImage: seo.ogImage,
          twitterTitle: seo.twitterTitle,
          twitterDescription: seo.twitterDescription,
          noIndex: seo.noIndex || false,
          noFollow: seo.noFollow || false,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        post: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          author: post.author,
          createdAt: post.createdAt
        }
      });

    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }
);

// PUT /posts/:id - Update post
router.put('/:id',
  authenticate,
  sanitizeInput,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        title,
        slug,
        content,
        excerpt,
        status,
        type,
        featuredImage,
        seo = {}
      } = req.body;

      console.log('PUT /posts/:id received data:');
      console.log('ID:', id);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('SEO data:', seo);

      // Check if post exists and belongs to user
      const existingPost = await prisma.post.findFirst({
        where: {
          id: id,
          authorId: req.user.userId
        }
      });

      if (!existingPost) {
        return res.status(404).json({
          error: 'Post not found',
          code: 'POST_NOT_FOUND'
        });
      }

      // Check slug uniqueness if changed
      if (slug && slug !== existingPost.slug) {
        const slugExists = await prisma.post.findUnique({
          where: { slug }
        });

        if (slugExists) {
          return res.status(409).json({
            error: 'A post with this slug already exists',
            code: 'SLUG_EXISTS'
          });
        }
      }

      const updatedPost = await prisma.post.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(slug && { slug }),
          ...(content !== undefined && { content: JSON.stringify(content) }),
          ...(excerpt !== undefined && { excerpt }),
          ...(status && { status }),
          ...(type && { type }),
          ...(featuredImage !== undefined && { featuredImage }),
          ...(status === 'PUBLISHED' && !existingPost.publishedAt && { publishedAt: new Date() }),
          // SEO fields
          ...(seo.metaTitle !== undefined && { metaTitle: seo.metaTitle }),
          ...(seo.metaDescription !== undefined && { metaDescription: seo.metaDescription }),
          ...(seo.keywords !== undefined && { metaKeywords: seo.keywords }),
          ...(seo.canonicalUrl !== undefined && { canonicalUrl: seo.canonicalUrl }),
          ...(seo.ogTitle !== undefined && { ogTitle: seo.ogTitle }),
          ...(seo.ogDescription !== undefined && { ogDescription: seo.ogDescription }),
          ...(seo.ogImage !== undefined && { ogImage: seo.ogImage }),
          ...(seo.twitterTitle !== undefined && { twitterTitle: seo.twitterTitle }),
          ...(seo.twitterDescription !== undefined && { twitterDescription: seo.twitterDescription }),
          ...(seo.noIndex !== undefined && { noIndex: seo.noIndex }),
          ...(seo.noFollow !== undefined && { noFollow: seo.noFollow }),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Post updated successfully',
        post: updatedPost
      });

    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }
);

// DELETE /posts/:id - Delete post
router.delete('/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if post exists and belongs to user
      const existingPost = await prisma.post.findFirst({
        where: {
          id: id,
          authorId: req.user.userId
        }
      });

      if (!existingPost) {
        return res.status(404).json({
          error: 'Post not found',
          code: 'POST_NOT_FOUND'
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
      console.error('Delete post error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }
);

export default router;
