import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { webSocketService, NotificationUpdate, TaskUpdate, StatsUpdate } from '../services/WebSocketService';
import { useAuth } from './AuthContext';
import { Notification, DashboardStats } from '../services/ApiService';

interface RealtimeContextType {
  isConnected: boolean;
  connectionState: string;
  notifications: Notification[];
  unreadCount: number;
  dashboardStats: DashboardStats | null;
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
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('DISCONNECTED');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
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
            // Add new notification to the beginning
            return [notification, ...prev];
          
          case 'read':
            // Mark notification as read
            return prev.map(n => 
              n.id === notification.id ? { ...n, read: true } : n
            );
          
          case 'deleted':
            // Remove notification
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
      setDashboardStats(prev => ({
        ...prev,
        ...statsUpdate
      }));
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

    // Monitor connection state changes
    const connectionMonitor = setInterval(handleConnectionChange, 1000);

    return () => {
      clearInterval(connectionMonitor);
      // Note: We don't disconnect here as other components might be using it
    };
  }, []);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (user && !isConnected) {
      connect();
    } else if (!user && isConnected) {
      disconnect();
    }
  }, [user, isConnected, connect, disconnect]);

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
