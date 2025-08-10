import { createServer } from 'http';
import express from 'express';
import { webSocketService } from '../services/WebSocketService';

describe('WebSocket Integration', () => {
  let server: any;
  let app: express.Application;

  beforeAll(() => {
    app = express();
    server = createServer(app);
  });

  afterAll((done) => {
    if (server) {
      webSocketService.shutdown();
      server.close(done);
    } else {
      done();
    }
  });

  it('should initialize WebSocket service without errors', () => {
    expect(() => {
      webSocketService.initialize(server);
    }).not.toThrow();
  });

  it('should provide connection statistics', () => {
    const stats = webSocketService.getConnectionStats();
    expect(stats).toHaveProperty('totalConnections');
    expect(stats).toHaveProperty('agencyConnections');
    expect(typeof stats.totalConnections).toBe('number');
    expect(typeof stats.agencyConnections).toBe('object');
  });

  it('should handle client notifications without errors', () => {
    const mockClient = {
      id: 1,
      name: 'Test Client',
      email: 'test@example.com',
      phone: '+1234567890',
      visaType: 'business' as any,
      status: 'pending' as any,
      notes: 'Test notes',
      agencyId: 'test-agency-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user',
      updatedBy: 'test-user'
    };

    expect(() => {
      webSocketService.notifyClientCreated(mockClient);
      webSocketService.notifyClientUpdated(mockClient);
      webSocketService.notifyClientDeleted(1, 'Test Client', 'test-agency-id');
    }).not.toThrow();
  });

  it('should handle stats notifications without errors', () => {
    const mockStats = {
      totalClients: 10,
      pending: 3,
      inProgress: 2,
      underReview: 1,
      completed: 3,
      approved: 1,
      rejected: 0,
      documentsRequired: 0
    };

    expect(() => {
      webSocketService.notifyClientStats(mockStats, 'test-agency-id');
    }).not.toThrow();
  });
});