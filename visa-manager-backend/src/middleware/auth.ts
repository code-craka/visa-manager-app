import { Request, Response, NextFunction } from 'express';
import { StackServerApp } from '@stackframe/stack';

// Initialize Stack with environment variables and proper configuration
const stack = new StackServerApp({
  projectId: process.env.STACK_PROJECT_ID!,
  publishableClientKey: process.env.STACK_PUBLISHABLE_CLIENT_KEY!,
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY!,
  tokenStore: 'nextjs-cookie', // Required tokenStore configuration
});

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        displayName: string;
        primaryEmail: string;
      };
    }
  }
}

// Middleware to verify Neon Auth token
export const verifyNeonAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: No valid authorization header found'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Stack - use proper method
    const user = await stack.getUser({
      tokenStore: {
        accessToken: token
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired token'
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.primaryEmail || '',
      displayName: user.displayName || user.primaryEmail || '',
      primaryEmail: user.primaryEmail || ''
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
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Import here to avoid circular dependencies
      const { getUserByNeonId } = await import('../models/User.js');
      const user = await getUserByNeonId(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found in database' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: user.role
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Role verification failed' });
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
    const user = await stack.getUser({
      tokenStore: {
        accessToken: token
      }
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.primaryEmail || '',
        displayName: user.displayName || user.primaryEmail || '',
        primaryEmail: user.primaryEmail || ''
      };
    }

    next();
  } catch (error) {
    // Silently fail and continue without user
    console.warn('Optional auth failed:', error);
    next();
  }
};

export { stack };
