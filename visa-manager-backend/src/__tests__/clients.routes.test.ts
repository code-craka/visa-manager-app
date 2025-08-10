// Unit tests for Client Routes
// Testing the REST API endpoints for client management including statistics

import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

// Mock the ClientService
const mockClientService = {
  createClient: jest.fn() as jest.MockedFunction<any>,
  getClients: jest.fn() as jest.MockedFunction<any>,
  getClientById: jest.fn() as jest.MockedFunction<any>,
  updateClient: jest.fn() as jest.MockedFunction<any>,
  deleteClient: jest.fn() as jest.MockedFunction<any>,
  getClientStats: jest.fn() as jest.MockedFunction<any>,
  getClientsForTaskAssignment: jest.fn() as jest.MockedFunction<any>,
  getClientCount: jest.fn() as jest.MockedFunction<any>
};

// Mock the auth middleware
const mockRequireAuth = jest.fn((req: any, res: Response, next: NextFunction) => {
  req.user = {
    id: 'test-agency-id',
    email: 'test@example.com',
    displayName: 'Test User',
    primaryEmail: 'test@example.com',
    role: 'agency'
  };
  next();
}) as jest.MockedFunction<any>;

const mockRequireRole = jest.fn(() => (req: Request, res: Response, next: NextFunction) => next()) as jest.MockedFunction<any>;

// Mock the modules
jest.mock('../services/ClientService', () => ({
  ClientService: jest.fn().mockImplementation(() => mockClientService)
}));

jest.mock('../middleware/auth', () => ({
  requireAuth: mockRequireAuth,
  requireRole: mockRequireRole
}));

import clientRoutes from '../routes/clients';
import { ClientStats, VisaType, ClientStatus } from '../models/Client';
import { ClientError, CLIENT_ERRORS } from '../services/ClientError';

describe('Client Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/clients', clientRoutes);
    jest.clearAllMocks();
  });

  describe('GET /api/clients/stats', () => {
    it('should return client statistics successfully', async () => {
      const mockStats: ClientStats = {
        totalClients: 10,
        pending: 2,
        inProgress: 3,
        underReview: 1,
        completed: 2,
        approved: 1,
        rejected: 1,
        documentsRequired: 0
      };

      mockClientService.getClientStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/clients/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockStats
      });

      expect(mockClientService.getClientStats).toHaveBeenCalledWith('test-agency-id');
      expect(mockRequireAuth).toHaveBeenCalled();
      expect(mockRequireRole).toHaveBeenCalledWith(['agency']);
    });

    it('should handle statistics calculation errors', async () => {
      const error = new ClientError(
        'Failed to retrieve client statistics',
        CLIENT_ERRORS.STATS_FAILED.status,
        CLIENT_ERRORS.STATS_FAILED.code
      );

      mockClientService.getClientStats.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/clients/stats')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to retrieve client statistics',
        errorCode: 'STATS_FAILED'
      });
    });

    it('should handle unexpected errors in statistics endpoint', async () => {
      mockClientService.getClientStats.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .get('/api/clients/stats')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to retrieve client statistics',
        errorCode: 'STATS_FAILED'
      });
    });

    it('should require authentication for statistics endpoint', async () => {
      // Mock auth failure
      mockRequireAuth.mockImplementationOnce((req: any, res: Response, _next: NextFunction) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      await request(app)
        .get('/api/clients/stats')
        .expect(401);

      expect(mockClientService.getClientStats).not.toHaveBeenCalled();
    });

    it('should require agency role for statistics endpoint', async () => {
      // Mock role check failure
      mockRequireRole.mockImplementationOnce(() => (_req: Request, res: Response, _next: NextFunction) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      await request(app)
        .get('/api/clients/stats')
        .expect(403);

      expect(mockClientService.getClientStats).not.toHaveBeenCalled();
    });

    it('should return empty statistics when no clients exist', async () => {
      const emptyStats: ClientStats = {
        totalClients: 0,
        pending: 0,
        inProgress: 0,
        underReview: 0,
        completed: 0,
        approved: 0,
        rejected: 0,
        documentsRequired: 0
      };

      mockClientService.getClientStats.mockResolvedValue(emptyStats);

      const response = await request(app)
        .get('/api/clients/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: emptyStats
      });
    });

    it('should handle database connection errors gracefully', async () => {
      mockClientService.getClientStats.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/clients/stats')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to retrieve client statistics');
      expect(response.body.errorCode).toBe('STATS_FAILED');
    });
  });

  describe('GET /api/clients/for-assignment', () => {
    it('should return clients for task assignment', async () => {
      const mockClients = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          visaType: VisaType.BUSINESS,
          status: ClientStatus.PENDING
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          visaType: VisaType.TOURIST,
          status: ClientStatus.IN_PROGRESS
        }
      ];

      mockClientService.getClientsForTaskAssignment.mockResolvedValue(mockClients);

      const response = await request(app)
        .get('/api/clients/for-assignment')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockClients
      });

      expect(mockClientService.getClientsForTaskAssignment).toHaveBeenCalledWith('test-agency-id', []);
    });

    it('should handle exclude parameter for task assignment', async () => {
      const mockClients = [
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          visaType: VisaType.TOURIST,
          status: ClientStatus.IN_PROGRESS
        }
      ];

      mockClientService.getClientsForTaskAssignment.mockResolvedValue(mockClients);

      const response = await request(app)
        .get('/api/clients/for-assignment?exclude=1,3')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockClients
      });

      expect(mockClientService.getClientsForTaskAssignment).toHaveBeenCalledWith('test-agency-id', [1, 3]);
    });
  });

  describe('POST /api/clients', () => {
    it('should create a new client successfully', async () => {
      const clientData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        visaType: VisaType.BUSINESS,
        notes: 'Test client'
      };

      const createdClient = {
        id: 1,
        ...clientData,
        status: ClientStatus.PENDING,
        agencyId: 'test-agency-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-agency-id',
        updatedBy: 'test-agency-id'
      };

      mockClientService.createClient.mockResolvedValue(createdClient);

      const response = await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: createdClient,
        message: 'Client created successfully'
      });

      expect(mockClientService.createClient).toHaveBeenCalledWith(clientData, 'test-agency-id');
    });

    it('should handle validation errors during client creation', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        visaType: VisaType.BUSINESS
      };

      const validationError = new ClientError(
        'Validation failed',
        CLIENT_ERRORS.VALIDATION_FAILED.status,
        CLIENT_ERRORS.VALIDATION_FAILED.code
      );

      mockClientService.createClient.mockRejectedValue(validationError);

      const response = await request(app)
        .post('/api/clients')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errorCode).toBe('VALIDATION_FAILED');
    });
  });

  describe('GET /api/clients', () => {
    it('should return paginated clients list', async () => {
      const mockClients = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          visaType: VisaType.BUSINESS,
          status: ClientStatus.PENDING,
          agencyId: 'test-agency-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-agency-id',
          updatedBy: 'test-agency-id'
        }
      ];

      const mockCount = 1;

      mockClientService.getClients.mockResolvedValue(mockClients);
      mockClientService.getClientCount.mockResolvedValue(mockCount);

      const response = await request(app)
        .get('/api/clients?page=1&limit=20')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockClients);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 20,
        totalItems: 1,
        totalPages: 1
      });
    });

    it('should handle search and filter parameters', async () => {
      mockClientService.getClients.mockResolvedValue([]);
      mockClientService.getClientCount.mockResolvedValue(0);

      await request(app)
        .get('/api/clients?search=John&status=pending&visaType=business&sortBy=name&sortOrder=asc')
        .expect(200);

      expect(mockClientService.getClients).toHaveBeenCalledWith('test-agency-id', {
        search: 'John',
        status: 'pending',
        visaType: 'business',
        sortBy: 'name',
        sortOrder: 'asc',
        page: 1,
        limit: 20
      });
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should return specific client by ID', async () => {
      const mockClient = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        visaType: VisaType.BUSINESS,
        status: ClientStatus.PENDING,
        agencyId: 'test-agency-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-agency-id',
        updatedBy: 'test-agency-id'
      };

      mockClientService.getClientById.mockResolvedValue(mockClient);

      const response = await request(app)
        .get('/api/clients/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockClient
      });

      expect(mockClientService.getClientById).toHaveBeenCalledWith(1, 'test-agency-id');
    });

    it('should handle invalid client ID', async () => {
      const response = await request(app)
        .get('/api/clients/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid client ID');
      expect(response.body.errorCode).toBe('INVALID_ID');
    });

    it('should handle client not found', async () => {
      const notFoundError = new ClientError(
        'Client not found or access denied',
        CLIENT_ERRORS.NOT_FOUND.status,
        CLIENT_ERRORS.NOT_FOUND.code
      );

      mockClientService.getClientById.mockRejectedValue(notFoundError);

      const response = await request(app)
        .get('/api/clients/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Client not found or access denied');
      expect(response.body.errorCode).toBe('CLIENT_NOT_FOUND');
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('should update client successfully', async () => {
      const updateData = {
        name: 'John Updated',
        status: ClientStatus.IN_PROGRESS
      };

      const updatedClient = {
        id: 1,
        name: 'John Updated',
        email: 'john@example.com',
        visaType: VisaType.BUSINESS,
        status: ClientStatus.IN_PROGRESS,
        agencyId: 'test-agency-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-agency-id',
        updatedBy: 'test-agency-id'
      };

      mockClientService.updateClient.mockResolvedValue(updatedClient);

      const response = await request(app)
        .put('/api/clients/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: updatedClient,
        message: 'Client updated successfully'
      });

      expect(mockClientService.updateClient).toHaveBeenCalledWith(1, updateData, 'test-agency-id');
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should delete client successfully', async () => {
      mockClientService.deleteClient.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/clients/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Client deleted successfully'
      });

      expect(mockClientService.deleteClient).toHaveBeenCalledWith(1, 'test-agency-id');
    });

    it('should handle deletion of client with active tasks', async () => {
      const activeTasksError = new ClientError(
        'Cannot delete client with active tasks',
        CLIENT_ERRORS.HAS_ACTIVE_TASKS.status,
        CLIENT_ERRORS.HAS_ACTIVE_TASKS.code
      );

      mockClientService.deleteClient.mockRejectedValue(activeTasksError);

      const response = await request(app)
        .delete('/api/clients/1')
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot delete client with active tasks');
      expect(response.body.errorCode).toBe('HAS_ACTIVE_TASKS');
    });
  });
});