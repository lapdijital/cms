import { NextFunction, Request, Response } from 'express';
import { SiteModel } from '../models/Site.js';

// Domain-based CORS validation middleware
export const validateDomainCors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const origin = req.get('Origin') || req.get('Referer');
    
    console.log('CORS Validation - API Key:', apiKey);
    console.log('CORS Validation - Origin:', origin);
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key is required',
        message: 'x-api-key header must be provided' 
      });
    }

    // Test API key for development
    if (apiKey === 'cmdozt34f0004p4aew6o2k8r1') {
      console.log('✅ Using test API key');
      req.site = {
        id: 'test-site',
        name: 'Test Site',
        domain: null,
        apiKey: apiKey,
        isActive: true
      };
      
      return next();
    }

    // Find site by API key
    const site = await SiteModel.findByApiKey(apiKey);
    if (!site) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        message: 'The provided API key is not valid' 
      });
    }

    // Check if site is active
    if (!site.isActive) {
      return res.status(403).json({ 
        error: 'Site deactivated',
        message: 'This site has been deactivated' 
      });
    }

    // Allow localhost for development
    const isLocalhost = origin && (
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') ||
      origin.includes('::1')
    );

    // Allow if no domain is set (for testing) or if localhost
    if (!site.domain || isLocalhost) {
      req.site = site;
      return next();
    }

    // Validate domain
    if (!origin) {
      return res.status(403).json({ 
        error: 'Origin required',
        message: 'Request must include origin header' 
      });
    }

    // Extract domain from origin
    const requestDomain = new URL(origin).hostname;
    const allowedDomain = site.domain;

    // Check if domains match (allow subdomains)
    const isAllowedDomain = requestDomain === allowedDomain || 
                           requestDomain.endsWith(`.${allowedDomain}`);

    if (!isAllowedDomain) {
      return res.status(403).json({ 
        error: 'Domain not allowed',
        message: `Requests from ${requestDomain} are not allowed for this API key`,
        allowedDomain: allowedDomain
      });
    }

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Add site to request for use in handlers
    req.site = site;
    next();

  } catch (error) {
    console.error('CORS validation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to validate request' 
    });
  }
};

// Handle preflight OPTIONS requests
export const handleCorsOptions = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(200).end();
  }
  next();
};

// Extend Request interface to include site
declare global {
  namespace Express {
    interface Request {
      site?: any;
    }
  }
}
