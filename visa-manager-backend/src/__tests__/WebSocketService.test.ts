import { webSocketService } from '../services/WebSocketService';
import { Client, ClientStatus, VisaType } from '../models/Client';

describe('WebSocketService', () => {
  const mockClient: Client = {
    id: 1,
    name: 'Test Client',
    email: 'test@example.com',
    phone: '+1234567890',
    visaType: VisaType.BUSINESS,
    status: ClientStatus.PENDING,
    notes: 'Test notes',
    agencyId: 'test-agency-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'test-user',
    updatedBy: 'test-user'
  };

  describe('Client Event Notifications', () => {
    it('should have notifyClientCreated method', () => {
      expect(typeof webSocketService.notifyClientCreated).toBe('function');
    });

    it('should have notifyClientUpdated method', () => {
      expect(typeof webSocketService.notifyClientUpdated).toBe('function');
    });

    it('should have notifyClientDeleted method', () => {
      expect(typeof webSocketService.notifyClientDeleted).toBe('function');
    });

    it('should have notifyClientStats method', () => {
      expect(typeof webSocketService.notifyClientStats).toBe('function');
    });

    it('should call notifyClientCreated without errors', () => {
      expect(() => {
        webSocketService.notifyClientCreated(mockClient);
      }).not.toThrow();
    });

    it('should call notifyClientUpdated without errors', () => {
      expect(() => {
        webSocketService.notifyClientUpdated(mockClient, { name: 'Old Name' });
      }).not.toThrow();
    });

    it('should call notifyClientDeleted without errors', () => {
      expect(() => {
        webSocketService.notifyClientDeleted(1, 'Test Client', 'test-agency-id');
      }).not.toThrow();
    });

    it('should call notifyClientStats without errors', () => {
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

  describe('Connection Management', () => {
    it('should have getConnectionStats method', () => {
      expect(typeof webSocketService.getConnectionStats).toBe('function');
    });

    it('should return connection stats', () => {
      const stats = webSocketService.getConnectionStats();
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('agencyConnections');
      expect(typeof stats.totalConnections).toBe('number');
      expect(typeof stats.agencyConnections).toBe('object');
    });

    it('should have shutdown method', () => {
      expect(typeof webSocketService.shutdown).toBe('function');
    });
  });
});