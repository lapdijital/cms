import { PostStatus, Post as PrismaPost } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface PostWithRelations extends PrismaPost {
    author: {
        id: string;
        name: string;
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
    _count?: {
        comments: number;
    };
}

export interface PostsFilter {
    status?: PostStatus;
    categorySlug?: string;
    tagSlug?: string;
    authorId?: string;
    publishedOnly?: boolean;
}

export interface PostsPagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface PostsResult {
    posts: PostWithRelations[];
    pagination: PostsPagination;
}

export class PostsModel {
    // Find post by ID or slug
    static async findById(id: string): Promise<PostWithRelations | null> {
        try {
            return await prisma.post.findFirst({
                where: {
                    OR: [
                        { id },
                        { slug: id }
                    ]
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
                }
            }) as PostWithRelations | null;
        } catch (error) {
            console.error('Error finding post by ID:', error);
            return null;
        }
    }

    // Find published post by ID or slug (for public access)
    static async findPublishedById(slug: string): Promise<PostWithRelations | null> {
        try {
            return await prisma.post.findFirst({
                where: {
                    OR: [
                        { slug },
                        { slug }
                    ],
                    status: PostStatus.PUBLISHED,
                    publishedAt: {
                        not: null
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
                    },
                    _count: {
                        select: {
                            comments: true
                        }
                    }
                }
            }) as PostWithRelations | null;
        } catch (error) {
            console.error('Error finding published post by ID:', error);
            return null;
        }
    }

    // Get all posts with filtering and pagination
    static async findMany(
        filter: PostsFilter = {}, 
        page: number = 1, 
        limit: number = 10
    ): Promise<PostsResult> {
        try {
            const offset = (page - 1) * limit;

            // Build where clause
            const whereClause: any = {};

            // Status filter
            if (filter.status) {
                whereClause.status = filter.status;
            }

            // Published only filter
            if (filter.publishedOnly) {
                whereClause.status = PostStatus.PUBLISHED;
                whereClause.publishedAt = {
                    not: null
                };
            }

            // Author filter
            if (filter.authorId) {
                whereClause.authorId = filter.authorId;
            }

            // Category filter
            if (filter.categorySlug) {
                whereClause.categories = {
                    some: {
                        slug: filter.categorySlug
                    }
                };
            }

            // Tag filter
            if (filter.tagSlug) {
                whereClause.tags = {
                    some: {
                        slug: filter.tagSlug
                    }
                };
            }

            // Get posts
            const posts = await prisma.post.findMany({
                where: whereClause,
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
                orderBy: { 
                    publishedAt: 'desc' 
                },
                take: limit,
                skip: offset
            }) as PostWithRelations[];

            // Get total count
            const total = await prisma.post.count({
                where: whereClause
            });

            return {
                posts,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error('Error finding posts:', error);
            return {
                posts: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    pages: 0
                }
            };
        }
    }

    // Get published posts (for public access)
    static async findPublishedPosts(
        categorySlug?: string,
        tagSlug?: string,
        page: number = 1,
        limit: number = 10
    ): Promise<PostsResult> {
        return this.findMany({
            publishedOnly: true,
            categorySlug,
            tagSlug
        }, page, limit);
    }

    // Get user's posts
    static async findUserPosts(
        authorId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<PostsResult> {
        return this.findMany({
            authorId
        }, page, limit);
    }

    // Search posts by title or content
    static async searchPosts(
        query: string,
        page: number = 1,
        limit: number = 10,
        publishedOnly: boolean = true
    ): Promise<PostsResult> {
        try {
            const offset = (page - 1) * limit;

            const whereClause: any = {
                OR: [
                    {
                        title: {
                            contains: query,
                            mode: 'insensitive'
                        }
                    },
                    {
                        excerpt: {
                            contains: query,
                            mode: 'insensitive'
                        }
                    }
                ]
            };

            if (publishedOnly) {
                whereClause.status = PostStatus.PUBLISHED;
                whereClause.publishedAt = {
                    not: null
                };
            }

            const posts = await prisma.post.findMany({
                where: whereClause,
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
                orderBy: {
                    publishedAt: 'desc'
                },
                take: limit,
                skip: offset
            }) as PostWithRelations[];

            const total = await prisma.post.count({
                where: whereClause
            });

            return {
                posts,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error('Error searching posts:', error);
            return {
                posts: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    pages: 0
                }
            };
        }
    }
}