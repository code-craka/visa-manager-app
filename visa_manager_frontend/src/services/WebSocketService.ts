import { Notification } from './ApiService';

export interface WebSocketMessage {
  type: 'notification' | 'task_update' | 'client_update' | 'stats_update';
  data: any;
  timestamp: string;
}

export interface NotificationUpdate {
  notification: Notification;
  action: 'new' | 'read' | 'deleted';
}

export interface TaskUpdate {
  task_id: string;
  status: string;
  assigned_to?: string;
  updated_by: string;
  message?: string;
}

export interface StatsUpdate {
  total_clients?: number;
  completed_tasks?: number;
  pending_tasks?: number;
  total_commission?: number;
  total_earned?: number;
}

type WebSocketEventCallback = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  private pingInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, WebSocketEventCallback[]> = new Map();
  private isConnecting = false;
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // Use 10.0.2.2 for Android emulator or your computer's IP for physical device
    this.baseUrl = __DEV__ 
      ? 'ws://10.0.2.2:3000' 
      : 'wss://your-production-domain.com';
  }

  connect(authToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
        resolve();
        return;
      }

      this.isConnecting = true;
      this.token = authToken;

      try {
        // Connect with authentication token
        this.ws = new WebSocket(`${this.baseUrl}/ws?token=${authToken}`);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.stopPing();
          
          // Auto-reconnect if not manually closed
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.stopPing();
    this.listeners.clear();
  }

  private handleMessage(message: WebSocketMessage): void {
    const callbacks = this.listeners.get(message.type) || [];
    callbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in WebSocket message callback:', error);
      }
    });

    // Also trigger 'all' listeners
    const allCallbacks = this.listeners.get('all') || [];
    allCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in WebSocket all message callback:', error);
      }
    });
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.token) {
        this.connect(this.token).catch(error => {
          console.error('WebSocket reconnection failed:', error);
        });
      }
    }, delay);
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Event listeners
  on(eventType: string, callback: WebSocketEventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  off(eventType: string, callback: WebSocketEventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Convenience methods for specific event types
  onNotification(callback: (notification: NotificationUpdate) => void): void {
    this.on('notification', (message) => {
      callback(message.data as NotificationUpdate);
    });
  }

  onTaskUpdate(callback: (taskUpdate: TaskUpdate) => void): void {
    this.on('task_update', (message) => {
      callback(message.data as TaskUpdate);
    });
  }

  onStatsUpdate(callback: (statsUpdate: StatsUpdate) => void): void {
    this.on('stats_update', (message) => {
      callback(message.data as StatsUpdate);
    });
  }

  // Send message to server
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'CONNECTED';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'DISCONNECTED';
      default: return 'UNKNOWN';
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default WebSocketService;
