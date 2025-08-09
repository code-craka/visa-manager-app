// Test setup file for mocking common dependencies

import { Request, Response, NextFunction } from 'express';

// Mock authentication middleware
export const mockRequireAuth = jest.fn((req: Request, res: Response, next: NextFunction) => {
  (req as any).user = {
    id: 'test-user-123',
    email: 'test@agency.com',
    displayName: 'Test User',
    primaryEmail: 'test@agency.com',
    role: 'agency',
    dbUserId: 1
  };
  next();
});

// Mock role middleware
export const mockRequireRole = jest.fn(() => (req: Request, res: Response, next: NextFunction) => {
  next();
});

// Mock the middleware modules
jest.mock('../middleware/auth', () => ({
  requireAuth: mockRequireAuth,
  requireRole: mockRequireRole
}));