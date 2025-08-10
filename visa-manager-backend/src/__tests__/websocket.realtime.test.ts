import { Server } from 'socket.io';
import { createServer } from 'http';
import Client from 'socket.io-client';
import { WebSocketService } from '../services/WebSocketService';

describe('WebSocket Real-time Integration Tests', () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: any;
  let httpServer: any;
  let wsService: WebSocketService;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      clientSocket = Client(`http://localhost:${port}`);
      
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      clientSocket.on('connect', done);
    });

    wsService = new WebSocketService(io);
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Client Management Real-time Events', () => {
    it('broadcasts client created event to agency users', (done) => {
      const agencyId = 'test-agency-123';
      const newClient = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        visaType: 'business',
        status: 'pending',
        agencyId,
      };

      // Join agency room
      serverSocket.join(`agency:${agencyId}`);

      clientSocket.on('client:created', (data: any) => {
        expect(data.client).toEqual(newClient);
        expect(data.client.agencyId).toBe(agencyId);
        done();
      });

      // Simulate client creation
      wsService.broadcastClientCreated(newClient);
    });

    it('broadcasts client updated event to relevant users', (done) => {
      const agencyId = 'test-agency-123';
      const updatedClient = {
        id: 1,
        name: 'John Updated',
        email: 'john@example.com',
        visaType: 'business',
        status: 'approved',
        agencyId,
      };

      serverSocket.join(`agency:${agencyId}`);

      clientSocket.on('client:updated', (data: any) => {
        expect(data.client).toEqual(updatedClient);
        expect(data.client.status).toBe('approved');
        done();
      });

      wsService.broadcastClientUpdated(updatedClient);
    });

    it('broadcasts client deleted event to agency users', (done) => {
      const agencyId = 'test-agency-123';
      const clientId = 1;

      serverSocket.join(`agency:${agencyId}`);

      clientSocket.on('client:deleted', (data: any) => {
        expect(data.clientId).toBe(clientId);
        expect(data.agencyId).toBe(agencyId);
        done();
      });

      wsService.broadcastClientDeleted(clientId, agencyId);
    });

    it('broadcasts client statistics updates', (done) => {
      const agencyId = 'test-agency-123';
      const stats = {
        totalClients: 10,
        pending: 3,
        approved: 2,
        inProgress: 3,
        completed: 2,
        rejected: 0,
        underReview: 0,
        documentsRequired: 0,
      };

      serverSocket.join(`agency:${agencyId}`);

      clientSocket.on('client:stats', (data: any) => {
        expect(data.stats).toEqual(stats);
        expect(data.agencyId).toBe(agencyId);
        done();
      });

      wsService.broadcastClientStats(stats, agencyId);
    });

    it('handles user authentication and room joining', (done) => {
      const userData = {
        userId: 'user-123',
        role: 'agency',
        agencyId: 'agency-123',
      };

      serverSocket.on('authenticate', (data: any) => {
        expect(data.userId).toBe(userData.userId);
        expect(data.role).toBe(userData.role);
        
        // Simulate successful authentication
        serverSocket.join(`agency:${userData.agencyId}`);
        serverSocket.emit('authenticated', { success: true });
        done();
      });

      clientSocket.emit('authenticate', userData);
    });

    it('handles connection and disconnection events', (done) => {
      let connectionCount = 0;

      serverSocket.on('disconnect', () => {
        connectionCount--;
        expect(connectionCount).toBe(0);
        done();
      });

      connectionCount++;
      expect(connectionCount).toBe(1);

      clientSocket.disconnect();
    });

    it('prevents unauthorized access to agency rooms', (done) => {
      const unauthorizedAgencyId = 'unauthorized-agency';
      
      // Try to join unauthorized room
      serverSocket.join(`agency:${unauthorizedAgencyId}`);

      // Verify user cannot receive events for unauthorized agency
      clientSocket.on('client:created', () => {
        // This should not be called
        done(new Error('Unauthorized user received agency event'));
      });

      // Broadcast to unauthorized agency
      wsService.broadcastClientCreated({
        id: 1,
        name: 'Test Client',
        agencyId: unauthorizedAgencyId,
      });

      // Wait and verify no event was received
      setTimeout(() => {
        done();
      }, 100);
    });

    it('handles multiple concurrent connections', (done) => {
      const client2 = Client(`http://localhost:${(httpServer.address() as any).port}`);
      const agencyId = 'test-agency-multi';
      let eventCount = 0;

      const handleClientCreated = () => {
        eventCount++;
        if (eventCount === 2) {
          client2.close();
          done();
        }
      };

      clientSocket.on('client:created', handleClientCreated);
      client2.on('client:created', handleClientCreated);

      client2.on('connect', () => {
        // Both clients join the same agency room
        serverSocket.join(`agency:${agencyId}`);
        io.sockets.sockets.get(client2.id)?.join(`agency:${agencyId}`);

        // Broadcast event to both clients
        wsService.broadcastClientCreated({
          id: 1,
          name: 'Multi Client',
          agencyId,
        });
      });
    });

    it('handles WebSocket errors gracefully', (done) => {
      serverSocket.on('error', (error: any) => {
        expect(error).toBeDefined();
        done();
      });

      // Simulate an error
      serverSocket.emit('error', new Error('Test WebSocket error'));
    });

    it('maintains connection state and handles reconnection', (done) => {
      let reconnectCount = 0;

      clientSocket.on('reconnect', () => {
        reconnectCount++;
        expect(reconnectCount).toBe(1);
        done();
      });

      // Simulate connection loss and reconnection
      clientSocket.disconnect();
      setTimeout(() => {
        clientSocket.connect();
      }, 50);
    });

    it('filters events based on user permissions', (done) => {
      const partnerUserId = 'partner-123';
      const agencyId = 'agency-123';
      
      // Partner should only receive events for clients they have tasks for
      const clientWithTask = {
        id: 1,
        name: 'Client With Task',
        agencyId,
        assignedPartners: [partnerUserId],
      };

      const clientWithoutTask = {
        id: 2,
        name: 'Client Without Task',
        agencyId,
        assignedPartners: [],
      };

      let eventCount = 0;

      clientSocket.on('client:created', (data: any) => {
        eventCount++;
        expect(data.client.assignedPartners).toContain(partnerUserId);
        
        if (eventCount === 1) {
          done();
        }
      });

      // Simulate partner joining their specific room
      serverSocket.join(`partner:${partnerUserId}`);

      // Broadcast both events
      wsService.broadcastClientCreated(clientWithTask);
      wsService.broadcastClientCreated(clientWithoutTask);

      // Only the client with task should trigger the event
      setTimeout(() => {
        if (eventCount === 0) {
          done(new Error('No events received'));
        }
      }, 100);
    });
  });

  describe('Performance and Scalability', () => {
    it('handles high-frequency events efficiently', (done) => {
      const agencyId = 'performance-test-agency';
      const eventCount = 100;
      let receivedCount = 0;

      serverSocket.join(`agency:${agencyId}`);

      clientSocket.on('client:created', () => {
        receivedCount++;
        if (receivedCount === eventCount) {
          expect(receivedCount).toBe(eventCount);
          done();
        }
      });

      // Broadcast multiple events rapidly
      for (let i = 0; i < eventCount; i++) {
        wsService.broadcastClientCreated({
          id: i,
          name: `Client ${i}`,
          agencyId,
        });
      }
    });

    it('maintains performance with large payloads', (done) => {
      const agencyId = 'large-payload-test';
      const largeClient = {
        id: 1,
        name: 'Large Client',
        agencyId,
        notes: 'A'.repeat(10000), // Large notes field
        metadata: Array(1000).fill({ key: 'value', data: 'test' }),
      };

      serverSocket.join(`agency:${agencyId}`);

      const startTime = Date.now();

      clientSocket.on('client:created', (data: any) => {
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        expect(data.client.notes.length).toBe(10000);
        expect(data.client.metadata.length).toBe(1000);
        expect(processingTime).toBeLessThan(1000); // Should process within 1 second

        done();
      });

      wsService.broadcastClientCreated(largeClient);
    });
  });
});