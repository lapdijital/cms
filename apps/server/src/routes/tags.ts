import { Request, Response, Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { sanitizeInput } from '../middleware/validation.js';

const router = Router();

// Types
export interface TagCreateRequest {
  name: string;
  color?: string;
  slug?: string;
}

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET /tags - List all tags
router.get('/', async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /tags/:id - Get single tag
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        posts: {
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!tag) {
      return res.status(404).json({
        error: 'Tag not found',
        code: 'TAG_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: tag
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /tags - Create new tag
router.post('/', authenticate, sanitizeInput, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, color, slug }: TagCreateRequest = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Name is required',
        code: 'MISSING_NAME'
      });
    }

    const tagSlug = slug || generateSlug(name);
    
    // Check if slug exists
    const existingTag = await prisma.tag.findUnique({
      where: { slug: tagSlug }
    });

    if (existingTag) {
      return res.status(400).json({
        error: 'Slug already exists',
        code: 'SLUG_EXISTS'
      });
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug: tagSlug,
        color
      }
    });

    res.status(201).json({
      success: true,
      data: tag,
      message: 'Tag created successfully'
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// PUT /tags/:id - Update tag
router.put('/:id', authenticate, sanitizeInput, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<TagCreateRequest> = req.body;
    
    const existingTag = await prisma.tag.findUnique({
      where: { id }
    });

    if (!existingTag) {
      return res.status(404).json({
        error: 'Tag not found',
        code: 'TAG_NOT_FOUND'
      });
    }

    const updatePayload: any = { ...updateData };
    
    // Handle slug update
    if (updateData.name && !updateData.slug) {
      updatePayload.slug = generateSlug(updateData.name);
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: updatePayload
    });

    res.json({
      success: true,
      data: updatedTag,
      message: 'Tag updated successfully'
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// DELETE /tags/:id - Delete tag
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingTag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!existingTag) {
      return res.status(404).json({
        error: 'Tag not found',
        code: 'TAG_NOT_FOUND'
      });
    }

    // Check if tag has posts
    if (existingTag._count.posts > 0) {
      return res.status(400).json({
        error: 'Cannot delete tag with posts',
        code: 'TAG_HAS_POSTS'
      });
    }

    await prisma.tag.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

export default router;
