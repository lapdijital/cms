import { User as PrismaUser, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// Types
export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
  bio?: string;
  isActive?: boolean;
  siteName?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatar: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  site?: {
    id: string;
    name: string;
    domain: string;
    apiKey: string;
    isActive: boolean;
    description?: string;
  } | null;
}

export interface AuthResponse {
  success: boolean;
  user: UserResponse;
  message: string;
}

// User Model with Prisma
export class UserModel {
  // Find user by ID
  static async findById(id: string): Promise<PrismaUser | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          sites: true
        }
      });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  // Find user by email
  static async findByEmail(email: string): Promise<PrismaUser | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          sites: true
        }
      });
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  // Create new user
  static async create(userData: UserCreateRequest): Promise<PrismaUser | null> {
    try {
      return await prisma.user.create({
        data: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
          role: userData.role || UserRole.USER,
          bio: userData.bio,
          isActive: userData.isActive ?? true
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  // Update user
  static async update(id: string, data: Partial<UserCreateRequest>): Promise<PrismaUser | null> {
    try {
      return await prisma.user.update({
        where: { id },
        data
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  // Delete user
  static async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Find all users
  static async findAll(): Promise<PrismaUser[]> {
    try {
      return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error finding all users:', error);
      return [];
    }
  }

  // Get all users (admin only)
  static async findMany(skip?: number, take?: number): Promise<PrismaUser[]> {
    try {
      return await prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error finding users:', error);
      return [];
    }
  }

  // Convert to response format
  static toResponse(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      site: user.sites && user.sites.length > 0 ? {
        id: user.sites[0].id,
        name: user.sites[0].name,
        domain: user.sites[0].domain,
        apiKey: user.sites[0].apiKey,
        isActive: user.sites[0].isActive,
        description: user.sites[0].description
      } : null
    };
  }
}