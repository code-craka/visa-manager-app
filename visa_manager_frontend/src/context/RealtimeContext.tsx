import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { webSocketService, NotificationUpdate, TaskUpdate, StatsUpdate, ClientStatsUpdate } from '../services/WebSocketService';
import { useAuth } from './AuthContext';
import { Notification, DashboardStats } from '../services/ApiService';
import { ClientStats } from '../types/Client';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import NotificationService from '../services/NotificationService';
import OfflineService from '../services/OfflineService';

interface RealtimeContextType {
  isConnected: boolean;
  connectionState: string;
  notifications: Notification[];
  unreadCount: number;
  dashboardStats: DashboardStats | null;
  clientStats: ClientStats | null;
  lastUpdate: Date | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  markNotificationAsRead: (notificationId: number) => void;
  clearNotifications: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const { user, getAuthToken } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('DISCONNECTED');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  const connect = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.warn('No authentication token available for WebSocket connection');
        return;
      }

      await webSocketService.connect(token);
      setIsConnected(true);
      setConnectionState('CONNECTED');
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
      setConnectionState('DISCONNECTED');
    }
  }, [getAuthToken]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setIsConnected(false);
    setConnectionState('DISCONNECTED');
  }, []);

  const markNotificationAsRead = useCallback((notificationId: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Handle incoming notifications
  useEffect(() => {
    const handleNotification = (notificationUpdate: NotificationUpdate) => {
      const { notification, action } = notificationUpdate;
      
      setNotifications(prev => {
        switch (action) {
          case 'new':
            // Show browser notification for new notifications
            NotificationService.show({
              title: 'Visa Manager',
              body: notification.message || 'New notification received',
              tag: `notification-${notification.id}`,
              data: notification,
            });
            return [notification, ...prev];
          
          case 'read':
            return prev.map(n => 
              n.id === notification.id ? { ...n, read: true } : n
            );
          
          case 'deleted':
            return prev.filter(n => n.id !== notification.id);
          
          default:
            return prev;
        }
      });
      
      setLastUpdate(new Date());
    };

    const handleTaskUpdate = (taskUpdate: TaskUpdate) => {
      console.log('Task update received:', taskUpdate);
      setLastUpdate(new Date());
      // You can add task-specific state updates here if needed
    };

    const handleStatsUpdate = (statsUpdate: StatsUpdate) => {
      setDashboardStats(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...statsUpdate
        };
      });
      setLastUpdate(new Date());
    };

    const handleClientStatsUpdate = (clientStatsUpdate: ClientStatsUpdate['stats']) => {
      setClientStats(clientStatsUpdate);
      
      // Also update dashboard stats with client information
      setDashboardStats(prev => {
        if (!prev) return null;
        return {
          ...prev,
          totalClients: clientStatsUpdate.totalClients,
          total_clients: clientStatsUpdate.totalClients,
          clientStats: {
            pending: clientStatsUpdate.pending,
            inProgress: clientStatsUpdate.inProgress,
            underReview: clientStatsUpdate.underReview,
            completed: clientStatsUpdate.completed,
            approved: clientStatsUpdate.approved,
            rejected: clientStatsUpdate.rejected,
            documentsRequired: clientStatsUpdate.documentsRequired
          }
        };
      });
      
      setLastUpdate(new Date());
    };

    const handleConnectionChange = () => {
      setIsConnected(webSocketService.isConnected());
      setConnectionState(webSocketService.getConnectionState());
    };

    // Set up WebSocket event listeners
    webSocketService.onNotification(handleNotification);
    webSocketService.onTaskUpdate(handleTaskUpdate);
    webSocketService.onStatsUpdate(handleStatsUpdate);
    webSocketService.onClientStats(handleClientStatsUpdate);

    // Monitor connection state changes
    const connectionMonitor = setInterval(handleConnectionChange, 1000);

    return () => {
      clearInterval(connectionMonitor);
      // Note: We don't disconnect here as other components might be using it
    };
  }, []);

  // Handle network status changes
  useEffect(() => {
    webSocketService.handleNetworkChange(isOnline);
  }, [isOnline]);

  // Initialize services
  useEffect(() => {
    NotificationService.initialize();
    OfflineService.initialize();
  }, []);

  // Auto-connect when user is authenticated and online
  useEffect(() => {
    if (user && !isConnected && isOnline) {
      connect();
    } else if (!user && isConnected) {
      disconnect();
    }
  }, [user, isConnected, isOnline, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value: RealtimeContextType = {
    isConnected,
    connectionState,
    notifications,
    unreadCount,
    dashboardStats,
    clientStats,
    lastUpdate,
    connect,
    disconnect,
    markNotificationAsRead,
    clearNotifications
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export default RealtimeProvider;
