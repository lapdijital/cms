import express from 'express';
import { handleCorsOptions, validateDomainCors } from '../middleware/corsValidation.js';
import { PostsModel } from '../models/Posts.js';

const router = express.Router();

// Middleware to remove restrictive headers for SDK
router.use((req, res, next) => {
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  next();
});

// SDK JavaScript file
router.get('/lap-cms.js', (req, res) => {
  // Set CORS headers for SDK file
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.removeHeader('Cross-Origin-Resource-Policy'); // Remove restrictive header

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache

  const sdkCode = `
/**
 * LAP CMS JavaScript SDK
 * Enables easy integration with LAP CMS API
 */
(function() {
  'use strict';
  
  // Global LapCMS object
  window.LapCMS = {
    config: {
      apiKey: null,
      domain: null,
      baseUrl: '${req.protocol}://${req.get('host')}/api'
    },
    
    /**
     * Initialize SDK with configuration
     */
    init: function(options) {
      if (!options.apiKey) {
        throw new Error('LapCMS: API key is required');
      }
      
      this.config.apiKey = options.apiKey;
      this.config.domain = options.domain || window.location.hostname;
      },
    
    /**
     * Make API request with proper headers
     */
    request: function(endpoint, options = {}) {
      const url = this.config.baseUrl + endpoint;
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        ...options.headers
      };
            
      return fetch(url, {
        ...options,
        headers: headers
      }).then(response => {
        if (!response.ok) {
          throw new Error(\`API Error: \${response.status} \${response.statusText}\`);
        }
        return response.json();
      }).catch(error => {
        console.error('LapCMS API Error:', error);
        throw error;
      });
    },
    
    /**
     * Load posts and return data (no automatic rendering)
     */
    loadPosts: function(options = {}) {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.page) params.append('page', options.page);
      if (options.category) params.append('category', options.category);
      if (options.tag) params.append('tag', options.tag);
      
      const queryString = params.toString();
      const endpoint = '/sdk/posts' + (queryString ? '?' + queryString : '');
      
      return this.request(endpoint, { method: 'GET' });
    },
    
    /**
     * Load posts and display in container (helper method for easy integration)
     */
    renderPosts: function(selector, options = {}) {
      const container = document.querySelector(selector);
      if (!container) {
        console.error('LapCMS: Container not found:', selector);
        return Promise.reject(new Error('Container not found'));
      }
      
      // Show loading state if template provided
      if (options.loadingTemplate) {
        container.innerHTML = options.loadingTemplate;
      } else {
        container.innerHTML = '<div class="lap-cms-loading">İçerikler yükleniyor...</div>';
      }
      
      return this.loadPosts(options).then(data => {
        if (options.template && typeof options.template === 'function') {
          // Custom template function
          const html = data.posts.map(options.template).join('');
          container.innerHTML = html;
        } else if (options.customRender && typeof options.customRender === 'function') {
          // Complete custom render function
          options.customRender(container, data.posts, data);
        } else {
          // Default simple template
          const html = data.posts.map(post => \`
            <div class="lap-cms-post" data-post-id="\${post.id}">
              <h3>\${post.title}</h3>
              <p>\${post.excerpt || ''}</p>
              <small>\${new Date(post.publishedAt).toLocaleDateString('tr-TR')}</small>
            </div>
          \`).join('');
          container.innerHTML = html;
        }
        return data;
      }).catch(error => {
        console.error('LapCMS: Failed to load posts:', error);
        if (options.errorTemplate) {
          container.innerHTML = options.errorTemplate.replace('{error}', error.message);
        } else {
          container.innerHTML = '<div class="lap-cms-error">İçerikler yüklenemedi.</div>';
        }
        throw error;
      });
    },
    
    /**
     * Load single post
     */
    loadPost: function(slug) {
      return this.request(\`/sdk/posts/\${slug}\`, {
        method: 'GET'
      });
    },
    
    /**
     * Load categories
     */
    loadCategories: function() {
      return this.request('/sdk/categories', { method: 'GET' });
    },
    
    /**
     * Load tags
     */
    loadTags: function() {
      return this.request('/sdk/tags', { method: 'GET' });
    },
    
    /**
     * Search posts
     */
    searchPosts: function(query, options = {}) {
      const params = new URLSearchParams();
      params.append('q', query);
      if (options.limit) params.append('limit', options.limit);
      if (options.page) params.append('page', options.page);
      
      return this.request('/sdk/search?' + params.toString(), { method: 'GET' });
    },
    
    /**
     * Apply basic CSS styles (optional, minimal styling)
     */
    applyDefaultStyles: function() {
      if (document.getElementById('lap-cms-styles')) return;
      
      const styles = \`
        <style id="lap-cms-styles">
          .lap-cms-loading, .lap-cms-error {
            padding: 16px;
            text-align: center;
            border-radius: 4px;
            margin: 8px 0;
          }
          .lap-cms-loading {
            background: #f9f9f9;
            color: #666;
          }
          .lap-cms-error {
            background: #fee;
            color: #c33;
          }
          .lap-cms-post {
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #eee;
          }
          .lap-cms-post:last-child {
            border-bottom: none;
          }
        </style>
      \`;
      document.head.insertAdjacentHTML('beforeend', styles);
    }
  };
  
  // Auto-initialize if data attributes are present
  document.addEventListener('DOMContentLoaded', function() {
    const autoInit = document.querySelector('[data-lap-cms-auto]');
    if (autoInit) {
      const apiKey = autoInit.getAttribute('data-api-key');
      const domain = autoInit.getAttribute('data-domain');
      
      if (apiKey) {
        LapCMS.init({ apiKey, domain });
        
        // Auto-load posts if container is specified
        const postsContainer = autoInit.getAttribute('data-posts-container');
        if (postsContainer) {
          LapCMS.renderPosts(postsContainer);
        }
      }
    }
  });
  
})();
  `;

  res.send(sdkCode);
});

// SDK API endpoints (with CORS validation)
router.use('/posts', handleCorsOptions, validateDomainCors);

// Get posts for SDK
router.get('/posts', async (req, res) => {
  try {
    const { site } = req;
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const category = req.query.category as string;
    const tag = req.query.tag as string;

    // Get published posts using PostsModel
    const result = await PostsModel.findPublishedPosts(
      category,
      tag,
      page,
      limit
    );

    // Format posts for SDK response
    const formattedPosts = result.posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content ? JSON.parse(post.content) : null,
      featuredImage: post.featuredImage,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        name: post.author.name
      },
      categories: post.categories,
      tags: post.tags,
      commentsCount: post._count?.comments || 0,
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
      posts: formattedPosts,
      pagination: result.pagination,
      site: {
        name: site.name,
        domain: site.domain
      }
    });

  } catch (error) {
    console.error('SDK posts error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch posts'
    });
  }
});// Get single post for SDK
router.get('/posts/:slug', async (req, res) => {
  try {
    const { site } = req;
    const { slug } = req.params;

    // Get published post using PostsModel
    const post = await PostsModel.findPublishedById(slug);

    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
        message: 'The requested post was not found or is not published'
      });
    }

    // Format post for SDK response
    const formattedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content ? JSON.parse(post.content) : null,
      featuredImage: post.featuredImage,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        name: post.author.name
      },
      categories: post.categories,
      tags: post.tags,
      commentsCount: post._count?.comments || 0,
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
    };

    res.json({
      success: true,
      post: formattedPost,
      site: {
        name: site.name,
        domain: site.domain
      }
    });

  } catch (error) {
    console.error('SDK post error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch post'
    });
  }
});

// Search posts for SDK
router.get('/search', handleCorsOptions, validateDomainCors, async (req, res) => {
  try {
    const { site } = req;
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;

    if (!query) {
      return res.status(400).json({
        error: 'Search query is required',
        message: 'Please provide a search query using the "q" parameter'
      });
    }

    // Search published posts using PostsModel
    const result = await PostsModel.searchPosts(query, page, limit, true);

    // Format posts for SDK response
    const formattedPosts = result.posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content ? JSON.parse(post.content) : null,
      featuredImage: post.featuredImage,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        name: post.author.name
      },
      categories: post.categories,
      tags: post.tags,
      commentsCount: post._count?.comments || 0,
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
      query,
      posts: formattedPosts,
      pagination: result.pagination,
      site: {
        name: site.name,
        domain: site.domain
      }
    });

  } catch (error) {
    console.error('SDK search error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to search posts'
    });
  }
});

export default router;
