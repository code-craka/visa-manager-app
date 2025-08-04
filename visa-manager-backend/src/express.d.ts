// Express.js type extensions for custom Request properties
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        displayName: string;
        primaryEmail: string;
        role: 'admin' | 'agency' | 'partner';
        dbUserId?: number;
      };
    }
  }
}

export {};
