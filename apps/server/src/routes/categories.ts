import { Request, Response, Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { sanitizeInput } from '../middleware/validation.js';

const router = Router();

// Types
export interface CategoryCreateRequest {
  name: string;
  description?: string;
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

// GET /categories - List all categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
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
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /categories/:id - Get single category
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
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

    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /categories - Create new category
router.post('/', authenticate, sanitizeInput, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, color, slug }: CategoryCreateRequest = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Name is required',
        code: 'MISSING_NAME'
      });
    }

    const categorySlug = slug || generateSlug(name);
    
    // Check if slug exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug: categorySlug }
    });

    if (existingCategory) {
      return res.status(400).json({
        error: 'Slug already exists',
        code: 'SLUG_EXISTS'
      });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: categorySlug,
        description,
        color
      }
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// PUT /categories/:id - Update category
router.put('/:id', authenticate, sanitizeInput, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<CategoryCreateRequest> = req.body;
    
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return res.status(404).json({
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    const updatePayload: any = { ...updateData };
    
    // Handle slug update
    if (updateData.name && !updateData.slug) {
      updatePayload.slug = generateSlug(updateData.name);
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updatePayload
    });

    res.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// DELETE /categories/:id - Delete category
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!existingCategory) {
      return res.status(404).json({
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    // Check if category has posts
    if (existingCategory._count.posts > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with posts',
        code: 'CATEGORY_HAS_POSTS'
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

export default router;
