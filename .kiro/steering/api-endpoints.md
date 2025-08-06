---
inclusion: fileMatch
fileMatchPattern: '**/routes/*|**/api/*'
---

# API Endpoints Reference

## Authentication Endpoints
```typescript
// POST /api/auth/sync-user - Sync user with backend
// GET /api/auth/profile - Get user profile
// PATCH /api/auth/role - Update user role (agency only)
// GET /api/auth/users - Get all users (agency only)
```

## Client Management
```typescript
// GET /api/clients - List all clients
// POST /api/clients - Create new client
// GET /api/clients/:id - Get client details
// PUT /api/clients/:id - Update client
// DELETE /api/clients/:id - Delete client
```

## Task Management
```typescript
// GET /api/tasks - List tasks
// POST /api/tasks - Create task
// GET /api/tasks/:id - Get task details
// PUT /api/tasks/:id - Update task
// POST /api/tasks/:id/assign - Assign task
```

## Standard Response Format
```typescript
// Success Response
{
  success: true,
  data: any,
  message?: string
}

// Error Response
{
  success: false,
  error: string,
  details?: any
}
```

## Middleware Usage
```typescript
import { requireAuth, requireRole } from '../middleware/auth';

// Protected route
router.get('/protected', requireAuth, handler);

// Role-based route
router.post('/admin', requireAuth, requireRole(['agency']), handler);
```

## Request/Response Types
```typescript
interface ApiRequest extends Request {
  user?: {
    id: string;
    email: string;
    displayName: string;
    role: 'agency' | 'partner';
    dbUserId: number;
  };
}
```