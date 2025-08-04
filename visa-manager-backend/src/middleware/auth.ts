import { Request, Response, NextFunction } from 'express';

// Authentication middleware
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: No valid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // For development purposes, implement basic token validation
    // In production, replace with actual Stack Auth verification
    if (!token || token.length < 10) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid token format'
      });
    }

    // Mock user data for development - replace with actual Stack Auth verification
    req.user = {
      id: 'mock-user-id',
      email: 'user@example.com',
      displayName: 'Mock User',
      primaryEmail: 'user@example.com',
      role: 'partner',
      dbUserId: 1
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: 'Unauthorized: Authentication failed'
    });
  }
};

// Middleware to check user role
export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized: User not authenticated'
        });
      }

      if (!req.user.role || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Forbidden: Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        error: 'Internal server error during role verification'
      });
    }
  };
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.substring(7);
    
    // Basic token validation for development
    if (token && token.length >= 10) {
      req.user = {
        id: 'mock-user-id',
        email: 'user@example.com',
        displayName: 'Mock User',
        primaryEmail: 'user@example.com',
        role: 'partner',
        dbUserId: 1
      };
    }

    next();
  } catch (error) {
    // Silently fail and continue without user
    console.warn('Optional auth failed:', error);
    next();
  }
};

// Alias for compatibility
export const verifyNeonAuth = requireAuth;
