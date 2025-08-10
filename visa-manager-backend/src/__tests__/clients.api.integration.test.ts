import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import clientRoutes from '../routes/clients';
import { requireAuth } from '../middleware/auth';

// Mock database
const mockPool = {
  query: jest.fn(),
} as unknown as Pool;

jest.mock('../db', () => ({
  default: mockPool,
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  requireAuth: jest.fn((req, res, next) => {
    req.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'agency',
      dbUserId: 1,
    };
    next();
  }),
  requireRole: jest.fn(() => (req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api/clients', clientRoutes);

describe('Client API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/clients', () => {
    it('creates a new client successfully', async () => {
      const mockClient = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        visa_type: 'business',
        status: 'pending',
        notes: 'Test client',
        agency_id: 'test-user-id',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockClient],
      });

      const response = await request(app)
        .post('/api/clients')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          visaType: 'business',
          notes: 'Test client',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('returns 400 for invalid client data', async () => {
      const response = await request(app)
        .post('/api/clients')
        .send({
          name: '', // Invalid: empty name
          email: 'invalid-email', // Invalid: bad email format
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation');
    });

    it('returns 409 for duplicate email', async () => {
      (mockPool.query as jest.Mock).mockRejectedValueOnce({
        code: '23505', // PostgreSQL unique violation
        constraint: 'clients_email_key',
      });

      const response = await request(app)
        .post('/api/clients')
        .send({
          name: 'John Doe',
          email: 'existing@example.com',
          visaType: 'business',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email already exists');
    });
  });

  describe('GET /api/clients', () => {
    it('returns paginated client list', async () => {
      const mockClients = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          visa_type: 'business',
          status: 'pending',
          created_at: new Date(),
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          visa_type: 'tourist',
          status: 'approved',
          created_at: new Date(),
        },
      ];

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // Count query
        .mockResolvedValueOnce({ rows: mockClients }); // Data query

      const response = await request(app)
        .get('/api/clients')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clients).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('filters clients by search query', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            visa_type: 'business',
            status: 'pending',
          }],
        });

      const response = await request(app)
        .get('/api/clients')
        .query({ search: 'John', page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.clients).toHaveLength(1);
      expect(response.body.data.clients[0].name).toBe('John Doe');
    });

    it('filters clients by status', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            name: 'John Doe',
            status: 'pending',
          }],
        });

      const response = await request(app)
        .get('/api/clients')
        .query({ status: 'pending', page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.clients[0].status).toBe('pending');
    });
  });

  describe('GET /api/clients/:id', () => {
    it('returns client by ID', async () => {
      const mockClient = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        visa_type: 'business',
        status: 'pending',
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockClient],
      });

      const response = await request(app).get('/api/clients/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('returns 404 for non-existent client', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app).get('/api/clients/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('updates client successfully', async () => {
      const mockUpdatedClient = {
        id: 1,
        name: 'John Updated',
        email: 'john@example.com',
        status: 'approved',
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUpdatedClient],
      });

      const response = await request(app)
        .put('/api/clients/1')
        .send({
          name: 'John Updated',
          status: 'approved',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Updated');
    });

    it('returns 404 for non-existent client', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app)
        .put('/api/clients/999')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('deletes client successfully when no active tasks', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ task_count: '0' }] }) // No active tasks
        .mockResolvedValueOnce({ rowCount: 1 }); // Successful deletion

      const response = await request(app).delete('/api/clients/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('returns 409 when client has active tasks', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ task_count: '2' }], // Has active tasks
      });

      const response = await request(app).delete('/api/clients/1');

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('active tasks');
    });

    it('returns 404 for non-existent client', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ task_count: '0' }] })
        .mockResolvedValueOnce({ rowCount: 0 }); // No rows deleted

      const response = await request(app).delete('/api/clients/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/clients/stats', () => {
    it('returns client statistics', async () => {
      const mockStats = {
        total_clients: '10',
        pending: '3',
        approved: '2',
        in_progress: '3',
        completed: '2',
        rejected: '0',
        under_review: '0',
        documents_required: '0',
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockStats],
      });

      const response = await request(app).get('/api/clients/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalClients: 10,
        pending: 3,
        approved: 2,
        inProgress: 3,
        completed: 2,
      });
    });
  });

  describe('Authentication and Authorization', () => {
    it('requires authentication for all endpoints', async () => {
      // Mock auth middleware to reject
      (requireAuth as jest.Mock).mockImplementationOnce((req, res, next) => {
        res.status(401).json({ success: false, error: 'Unauthorized' });
      });

      const response = await request(app).get('/api/clients');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('enforces role-based access for creation', async () => {
      // Mock auth middleware with partner role
      (requireAuth as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'partner-user-id',
          role: 'partner',
          dbUserId: 2,
        };
        next();
      });

      const response = await request(app)
        .post('/api/clients')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          visaType: 'business',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});