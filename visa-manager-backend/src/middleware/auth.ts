import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// JWKS client for JWT verification
const jwksClientInstance = jwksClient({
  jwksUri: process.env.CLERK_JWKS_URL || 'https://clerk.techsci.io/.well-known/jwks.json',
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

// Function to get signing key
const getKey = (header: any, callback: any) => {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

// Clerk authentication middleware
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: No valid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if this is a development/mock token
    if (process.env.NODE_ENV === 'development' && token.startsWith('mock-')) {
      console.log('Using mock authentication for development');
      
      // Set mock user data for development
      req.user = {
        id: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        primaryEmail: 'test@example.com',
        role: 'agency',
        dbUserId: 1
      };

      return next();
    }

    try {
      // Verify JWT token using JWKS
      const decoded = await new Promise<any>((resolve, reject) => {
        jwt.verify(token, getKey, {
          audience: process.env.CLERK_PUBLISHABLE_KEY,
          issuer: 'https://clerk.techsci.io',
          algorithms: ['RS256']
        }, (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        });
      });

      if (!decoded || !decoded.sub) {
        return res.status(401).json({
          error: 'Unauthorized: Invalid token claims'
        });
      }

      // Set user data from JWT claims
      req.user = {
        id: decoded.sub,
        email: decoded.email || '',
        displayName: decoded.name || 'User',
        primaryEmail: decoded.email || '',
        role: decoded.role as 'agency' | 'partner' || 'partner',
        dbUserId: parseInt(decoded.sub.replace(/[^0-9]/g, '')) || 1 // Convert string ID to number
      };

      next();
    } catch (jwtError) {
      console.error('JWT token verification failed:', jwtError);
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error during authentication'
    });
  }
};

// Middleware to check user role
export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return _res.status(401).json({
          error: 'Unauthorized: User not authenticated'
        });
      }

      if (!req.user.role || !allowedRoles.includes(req.user.role)) {
        return _res.status(403).json({
          error: 'Forbidden: Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return _res.status(500).json({
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

    // Check if this is a development/mock token
    if (process.env.NODE_ENV === 'development' && token.startsWith('mock-')) {
      req.user = {
        id: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        primaryEmail: 'test@example.com',
        role: 'agency',
        dbUserId: 1
      };
    } else {
      try {
        // Try to verify JWT token
        const decoded = await new Promise<any>((resolve, reject) => {
          jwt.verify(token, getKey, {
            audience: process.env.CLERK_PUBLISHABLE_KEY,
            issuer: 'https://clerk.techsci.io',
            algorithms: ['RS256']
          }, (err, decoded) => {
            if (err) {
              reject(err);
            } else {
              resolve(decoded);
            }
          });
        });

        if (decoded && decoded.sub) {
          req.user = {
            id: decoded.sub,
            email: decoded.email || '',
            displayName: decoded.name || 'User',
            primaryEmail: decoded.email || '',
            role: decoded.role as 'agency' | 'partner' || 'partner',
            dbUserId: parseInt(decoded.sub.replace(/[^0-9]/g, '')) || 1 // Convert string ID to number
          };
        }
      } catch (jwtError) {
        // Silently fail and continue without user
        console.warn('Optional JWT auth failed:', jwtError);
      }
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
