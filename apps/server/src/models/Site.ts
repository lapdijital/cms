import { createId } from '@paralleldrive/cuid2';
import { Site } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// Prisma Site type
type PrismaSite = Site;

// Types
export interface SiteCreateRequest {
  name: string;
  domain?: string;
  description?: string;
  userId: string;
}

export interface SiteResponse {
  id: string;
  name: string;
  domain: string | null;
  apiKey: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Site Model with Prisma
export class SiteModel {
  // Find site by ID
  static async findById(id: string): Promise<PrismaSite | null> {
    try {
      return await prisma.site.findUnique({
        where: { id },
        include: {
          user: true
        }
      });
    } catch (error) {
      console.error('Error finding site by ID:', error);
      return null;
    }
  }

  // Find site by API key
  static async findByApiKey(apiKey: string): Promise<PrismaSite | null> {
    try {
      return await prisma.site.findUnique({
        where: { apiKey },
        include: {
          user: true
        }
      });
    } catch (error) {
      console.error('Error finding site by API key:', error);
      return null;
    }
  }

  // Find sites by user ID
  static async findByUserId(userId: string): Promise<PrismaSite[]> {
    try {
      return await prisma.site.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error finding sites by user ID:', error);
      return [];
    }
  }

  // Check if domain exists
  static async findByDomain(domain: string): Promise<PrismaSite | null> {
    try {
      return await prisma.site.findUnique({
        where: { domain }
      });
    } catch (error) {
      console.error('Error finding site by domain:', error);
      return null;
    }
  }

  // Create new site
  static async create(siteData: SiteCreateRequest): Promise<PrismaSite | null> {
    try {
      return await prisma.site.create({
        data: {
          name: siteData.name,
          domain: siteData.name,
          description: siteData.description,
          userId: siteData.userId
        }
      });
    } catch (error) {
      console.error('Error creating site:', error);
      return null;
    }
  }

  // Update site
  static async update(id: string, data: Partial<SiteCreateRequest & { apiKey?: string }>): Promise<PrismaSite | null> {
    try {
      return await prisma.site.update({
        where: { id },
        data
      });
    } catch (error) {
      console.error('Error updating site:', error);
      return null;
    }
  }

  // Delete site
  static async delete(id: string): Promise<boolean> {
    try {
      await prisma.site.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting site:', error);
      return false;
    }
  }

  // Convert to response format
  static toResponse(site: PrismaSite): SiteResponse {
    return {
      id: site.id,
      name: site.name,
      domain: site.domain,
      apiKey: site.apiKey,
      description: site.description,
      isActive: site.isActive,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
      userId: site.userId
    };
  }

  // Get all sites (admin only)
  static async findAll(): Promise<PrismaSite[]> {
    try {
      return await prisma.site.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error finding all sites:', error);
      return [];
    }
  }

  // Regenerate API key
  static async regenerateApiKey(id: string): Promise<PrismaSite | null> {
    try {
      return await prisma.site.update({
        where: { id },
        data: {
          apiKey: createId()
        }
      });
    } catch (error) {
      console.error('Error regenerating API key:', error);
      return null;
    }
  }
}
