import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { Client, ClientStats } from '../models/Client.js';

// WebSocket message types for client management
export interface ClientWebSocketMessage {
  type: 'client:created' | 'client:updated' | 'client:deleted' | 'client:stats' | 'ping' | 'pong';
  data?: any;
  timestamp: string;
  agencyId?: string;
}

export interface ClientCreatedEvent {
  client: Client;
}

export interface ClientUpdatedEvent {
  client: Client;
  previousData?: Partial<Client>;
}

export interface ClientDeletedEvent {
  clientId: number;
  clientName: string;
}

export interface ClientStatsEvent {
  stats: ClientStats;
}

// Connected client interface
interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  role: string;
  agencyId: string;
  lastPing: Date;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private jwksClientInstance: jwksClient.JwksClient;

  constructor() {
    // Initialize JWKS client for JWT verification
    this.jwksClientInstance = jwksClient({
      jwksUri: `https://${process.env.CLERK_DOMAIN}/.well-known/jwks.json`,
      requestHeaders: {},
      timeout: 30000,
    });
  }

  // Initialize WebSocket server
  initialize(server: any): void {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startPingInterval();

    console.log('🔌 WebSocket server initialized for client management');
  }

  // Verify client connection with JWT token
  private async verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): Promise<boolean> {
    try {
      const url = new URL(info.req.url!, `http://${info.req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        console.log('WebSocket connection rejected: No token provided');
        return false;
      }

      // Verify JWT token
      const decoded = await this.verifyJWT(token);
      if (!decoded) {
        console.log('WebSocket connection rejected: Invalid token');
        return false;
      }

      // Store user info in request for later use
      (info.req as any).user = decoded;
      return true;
    } catch (error) {
      console.error('WebSocket verification error:', error);
      return false;
    }
  }

  // Verify JWT token using JWKS
  private async verifyJWT(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Decode token header to get kid
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || !decoded.header.kid) {
        return reject(new Error('Invalid token structure'));
      }

      // Get signing key
      this.jwksClientInstance.getSigningKey(decoded.header.kid, (err, key) => {
        if (err) {
          return reject(err);
        }

        const signingKey = key?.getPublicKey();
        if (!signingKey) {
          return reject(new Error('No signing key found'));
        }

        // Verify token
        jwt.verify(token, signingKey, { algorithms: ['RS256'] }, (verifyErr, payload) => {
          if (verifyErr) {
            return reject(verifyErr);
          }
          resolve(payload);
        });
      });
    });
  }

  // Handle new WebSocket connection
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const user = (req as any).user;
    if (!user) {
      ws.close(1008, 'Authentication failed');
      return;
    }

    const clientId = `${user.sub}_${Date.now()}`;
    const connectedClient: ConnectedClient = {
      ws,
      userId: user.sub,
      role: user.role || 'agency',
      agencyId: user.role === 'agency' ? user.sub : user.agencyId || user.sub,
      lastPing: new Date()
    };

    this.clients.set(clientId, connectedClient);

    console.log(`WebSocket client connected: ${user.email} (${user.role})`);

    // Handle messages from client
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(clientId, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.clients.delete(clientId);
      console.log(`WebSocket client disconnected: ${user.email}`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.clients.delete(clientId);
    });

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'ping',
      timestamp: new Date().toISOString()
    });
  }

  // Handle messages from connected clients
  private handleClientMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'ping':
        client.lastPing = new Date();
        this.sendToClient(clientId, {
          type: 'pong',
          timestamp: new Date().toISOString()
        });
        break;
      
      case 'pong':
        client.lastPing = new Date();
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  // Send message to specific client
  private sendToClient(clientId: string, message: ClientWebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        this.clients.delete(clientId);
      }
    }
  }

  // Broadcast message to all clients in an agency
  private broadcastToAgency(agencyId: string, message: ClientWebSocketMessage): void {
    const agencyMessage = { ...message, agencyId };
    
    for (const [clientId, client] of this.clients.entries()) {
      if (client.agencyId === agencyId && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(agencyMessage));
        } catch (error) {
          console.error('Error broadcasting to agency:', error);
          this.clients.delete(clientId);
        }
      }
    }
  }

  // Broadcast message to all connected clients
  private broadcastToAll(message: ClientWebSocketMessage): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error broadcasting to all:', error);
          this.clients.delete(clientId);
        }
      }
    }
  }

  // Public methods for client events

  // Notify when a client is created
  notifyClientCreated(client: Client): void {
    const message: ClientWebSocketMessage = {
      type: 'client:created',
      data: { client } as ClientCreatedEvent,
      timestamp: new Date().toISOString()
    };

    this.broadcastToAgency(client.agencyId, message);
    console.log(`WebSocket: Client created notification sent for ${client.name}`);
  }

  // Notify when a client is updated
  notifyClientUpdated(client: Client, previousData?: Partial<Client>): void {
    const message: ClientWebSocketMessage = {
      type: 'client:updated',
      data: { client, previousData } as ClientUpdatedEvent,
      timestamp: new Date().toISOString()
    };

    this.broadcastToAgency(client.agencyId, message);
    console.log(`WebSocket: Client updated notification sent for ${client.name}`);
  }

  // Notify when a client is deleted
  notifyClientDeleted(clientId: number, clientName: string, agencyId: string): void {
    const message: ClientWebSocketMessage = {
      type: 'client:deleted',
      data: { clientId, clientName } as ClientDeletedEvent,
      timestamp: new Date().toISOString()
    };

    this.broadcastToAgency(agencyId, message);
    console.log(`WebSocket: Client deleted notification sent for ${clientName}`);
  }

  // Notify when client statistics are updated
  notifyClientStats(stats: ClientStats, agencyId: string): void {
    const message: ClientWebSocketMessage = {
      type: 'client:stats',
      data: { stats } as ClientStatsEvent,
      timestamp: new Date().toISOString()
    };

    this.broadcastToAgency(agencyId, message);
    console.log(`WebSocket: Client stats notification sent for agency ${agencyId}`);
  }

  // Start ping interval to keep connections alive
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = new Date();
      const timeout = 60000; // 1 minute timeout

      for (const [clientId, client] of this.clients.entries()) {
        const timeSinceLastPing = now.getTime() - client.lastPing.getTime();
        
        if (timeSinceLastPing > timeout) {
          console.log(`WebSocket client timeout: ${clientId}`);
          client.ws.close(1000, 'Ping timeout');
          this.clients.delete(clientId);
        } else if (client.ws.readyState === WebSocket.OPEN) {
          // Send ping
          this.sendToClient(clientId, {
            type: 'ping',
            timestamp: new Date().toISOString()
          });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Get connection statistics
  getConnectionStats(): { totalConnections: number; agencyConnections: Record<string, number> } {
    const agencyConnections: Record<string, number> = {};
    
    for (const client of this.clients.values()) {
      agencyConnections[client.agencyId] = (agencyConnections[client.agencyId] || 0) + 1;
    }

    return {
      totalConnections: this.clients.size,
      agencyConnections
    };
  }

  // Cleanup
  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    for (const client of this.clients.values()) {
      client.ws.close(1000, 'Server shutdown');
    }

    this.clients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    console.log('WebSocket service shut down');
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default WebSocketService;