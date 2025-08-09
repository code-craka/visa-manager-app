// Integration tests for client deletion functionality
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5

// Mock the database first
const mockQuery = jest.fn();

jest.mock('../db', () => ({
  default: {
    query: mockQuery,
  },
}));

import request from 'supertest';
import express from 'express';
import clientRoutes from '../routes/clients';
import { requireAuth, requireRole } from '../middleware/auth';

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  requireAuth: jest.fn((req: any, res: any, next: any) => {
    req.user = {
      id: 'test-agency-id',
      email: 'test@agency.com',
      displayName: 'Test Agency',
      role: 'agency'
    };
    next();
  }),
  requireRole: jest.fn(() => (req: any, res: any, next: any) => next())
}));

describe('Client Deletion Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/clients', clientRoutes);
  });

  describe('DELETE /api/clients/:id', () => {
    it('should successfully delete client when no active tasks exist', async () => {
      // Mock successful deletion
      mockQuery.mockResolvedValueOnce({ rows: [{ task_count: '0' }] }); // No active tasks
      mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // Successful deletion

      const response = await request(app)
        .delete('/api/clients/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Client deleted successfully'
      });

      // Verify correct database queries were made
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(1,
        expect.stringContaining('SELECT COUNT(*) as task_count FROM tasks'),
        [1]
      );
      expect(mockQuery).toHaveBeenNthCalledWith(2,
        'DELETE FROM clients WHERE id = $1 AND agency_id = $2',
        [1, 'test-agency-id']
      );
    });

    it('should return 409 error when client has active tasks', async () => {
      // Mock client with active tasks
      mockQuery.mockResolvedValueOnce({ rows: [{ task_count: '2' }] }); // Has active tasks

      const response = await request(app)
        .delete('/api/clients/1')
        .expect(409);

      expect(response.body).toEqual({
        success: false,
        error: 'Cannot delete client with active tasks',
        errorCode: 'HAS_ACTIVE_TASKS'
      });

      // Verify only task check query was made
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should return 404 error when client not found', async () => {
      // Mock client not found
      mockQuery.mockResolvedValueOnce({ rows: [{ task_count: '0' }] }); // No active tasks
      mockQuery.mockResolvedValueOnce({ rowCount: 0 }); // Client not found

      const response = await request(app)
        .delete('/api/clients/999')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Client not found or access denied',
        errorCode: 'CLIENT_NOT_FOUND'
      });
    });

    it('should return 400 error for invalid client ID', async () => {
      const response = await request(app)
        .delete('/api/clients/invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid client ID',
        errorCode: 'INVALID_ID'
      });

      // Verify no database queries were made
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .delete('/api/clients/1')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to delete client',
        errorCode: 'DELETION_FAILED'
      });
    });

    it('should require authentication', async () => {
      // Mock auth middleware to reject request
      (requireAuth as jest.Mock).mockImplementationOnce((req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      await request(app)
        .delete('/api/clients/1')
        .expect(401);
    });

    it('should require agency role', async () => {
      // Mock role middleware to reject request
      (requireRole as jest.Mock).mockImplementationOnce(() => (req: any, res: any, next: any) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      await request(app)
        .delete('/api/clients/1')
        .expect(403);
    });

    it('should handle concurrent deletion attempts', async () => {
      // Mock successful first check but client deleted by another request
      mockQuery.mockResolvedValueOnce({ rows: [{ task_count: '0' }] }); // No active tasks
      mockQuery.mockResolvedValueOnce({ rowCount: 0 }); // Client already deleted

      const response = await request(app)
        .delete('/api/clients/1')
        .expect(404);

      expect(response.body.errorCode).toBe('CLIENT_NOT_FOUND');
    });

    it('should validate numeric client ID', async () => {
      const testCases = ['0', '-1', '999999999999999999999'];
      
      for (const clientId of testCases) {
        if (clientId === '0' || clientId === '-1') {
          await request(app)
            .delete(`/api/clients/${clientId}`)
            .expect(400);
        } else {
          // Very large numbers should be handled by the service layer
          mockQuery.mockResolvedValueOnce({ rows: [{ task_count: '0' }] });
          mockQuery.mockResolvedValueOnce({ rowCount: 0 });
          
          await request(app)
            .delete(`/api/clients/${clientId}`)
            .expect(404);
        }
      }
    });

    it('should enforce Row-Level Security', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ task_count: '0' }] });
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      await request(app)
        .delete('/api/clients/1')
        .expect(200);

      // Verify that agency_id is included in the delete query for RLS
      expect(mockQuery).toHaveBeenNthCalledWith(2,
        'DELETE FROM clients WHERE id = $1 AND agency_id = $2',
        [1, 'test-agency-id']
      );
    });

    it('should handle edge case with zero active tasks', async () => {
      // Test with exactly zero tasks (edge case)
      mockQuery.mockResolvedValueOnce({ rows: [{ task_count: '0' }] });
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .delete('/api/clients/1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle edge case with one active task', async () => {
      // Test with exactly one active task (edge case)
      mockQuery.mockResolvedValueOnce({ rows: [{ task_count: '1' }] });

      const response = await request(app)
        .delete('/api/clients/1')
        .expect(409);

      expect(response.body.errorCode).toBe('HAS_ACTIVE_TASKS');
    });

    it('should check for correct task statuses', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ task_count: '0' }] });
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      await request(app)
        .delete('/api/clients/1')
        .expect(200);

      // Verify the task check excludes completed and cancelled tasks
      expect(mockQuery).toHaveBeenNthCalledWith(1,
        expect.stringContaining("status NOT IN ('completed', 'cancelled')"),
        [1]
      );
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error response format', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ task_count: '2' }] });

      const response = await request(app)
        .delete('/api/clients/1')
        .expect(409);

      // Verify error response structure
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('errorCode');
      expect(typeof response.body.error).toBe('string');
      expect(typeof response.body.errorCode).toBe('string');
    });

    it('should return consistent success response format', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ task_count: '0' }] });
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .delete('/api/clients/1')
        .expect(200);

      // Verify success response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });
  });
});