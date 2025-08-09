import { useEffect, useCallback, useRef } from 'react';
import { webSocketService } from '../services/WebSocketService';
import { Client, ClientStats } from '../types/Client';

export interface ClientRealtimeCallbacks {
  onClientCreated?: (client: Client) => void;
  onClientUpdated?: (client: Client, previousData?: Partial<Client>) => void;
  onClientDeleted?: (clientId: number, clientName: string) => void;
  onClientStats?: (stats: ClientStats) => void;
  onConnectionStatusChange?: (status: string) => void;
}

export interface ClientRealtimeState {
  isConnected: boolean;
  connectionStatus: string;
  lastUpdate: Date | null;
}

/**
 * Custom hook for managing real-time client updates via WebSocket
 * Provides connection management and event handling for client operations
 */
export const useClientRealtime = (callbacks: ClientRealtimeCallbacks = {}) => {
  const callbacksRef = useRef(callbacks);
  const stateRef = useRef<ClientRealtimeState>({
    isConnected: false,
    connectionStatus: 'DISCONNECTED',
    lastUpdate: null
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Connection status handler
  const handleConnectionStatusChange = useCallback((status: string) => {
    stateRef.current.connectionStatus = status;
    stateRef.current.isConnected = status === 'CONNECTED';
    
    if (callbacksRef.current.onConnectionStatusChange) {
      callbacksRef.current.onConnectionStatusChange(status);
    }
  }, []);

  // Client created handler
  const handleClientCreated = useCallback((client: Client) => {
    stateRef.current.lastUpdate = new Date();
    
    if (callbacksRef.current.onClientCreated) {
      callbacksRef.current.onClientCreated(client);
    }
  }, []);

  // Client updated handler
  const handleClientUpdated = useCallback((client: Client, previousData?: Partial<Client>) => {
    stateRef.current.lastUpdate = new Date();
    
    if (callbacksRef.current.onClientUpdated) {
      callbacksRef.current.onClientUpdated(client, previousData);
    }
  }, []);

  // Client deleted handler
  const handleClientDeleted = useCallback((clientId: number, clientName: string) => {
    stateRef.current.lastUpdate = new Date();
    
    if (callbacksRef.current.onClientDeleted) {
      callbacksRef.current.onClientDeleted(clientId, clientName);
    }
  }, []);

  // Client stats handler
  const handleClientStats = useCallback((stats: ClientStats) => {
    stateRef.current.lastUpdate = new Date();
    
    if (callbacksRef.current.onClientStats) {
      callbacksRef.current.onClientStats(stats);
    }
  }, []);

  // Setup WebSocket event listeners
  useEffect(() => {
    // Register event handlers
    webSocketService.onClientCreated(handleClientCreated);
    webSocketService.onClientUpdated(handleClientUpdated);
    webSocketService.onClientDeleted(handleClientDeleted);
    webSocketService.onClientStats(handleClientStats);

    // Monitor connection status
    const checkConnectionStatus = () => {
      const status = webSocketService.getConnectionState();
      if (status !== stateRef.current.connectionStatus) {
        handleConnectionStatusChange(status);
      }
    };

    // Check connection status periodically
    const statusInterval = setInterval(checkConnectionStatus, 1000);
    
    // Initial status check
    checkConnectionStatus();

    // Cleanup function
    return () => {
      clearInterval(statusInterval);
      
      // Note: WebSocket service cleanup is handled by the service itself
      // Individual event listener removal is not needed as we're using convenience methods
    };
  }, [
    handleClientCreated,
    handleClientUpdated,
    handleClientDeleted,
    handleClientStats,
    handleConnectionStatusChange
  ]);

  // Public methods
  const connect = useCallback(async (authToken: string) => {
    try {
      await webSocketService.connect(authToken);
      handleConnectionStatusChange('CONNECTED');
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      handleConnectionStatusChange('DISCONNECTED');
      throw error;
    }
  }, [handleConnectionStatusChange]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    handleConnectionStatusChange('DISCONNECTED');
  }, [handleConnectionStatusChange]);

  const getConnectionState = useCallback(() => {
    return {
      isConnected: stateRef.current.isConnected,
      connectionStatus: stateRef.current.connectionStatus,
      lastUpdate: stateRef.current.lastUpdate
    };
  }, []);

  const isConnected = useCallback(() => {
    return webSocketService.isConnected();
  }, []);

  return {
    connect,
    disconnect,
    getConnectionState,
    isConnected
  };
};

export default useClientRealtime;