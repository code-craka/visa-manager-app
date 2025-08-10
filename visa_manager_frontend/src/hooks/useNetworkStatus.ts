// Network Status Hook for Client Management
// Requirements: 1.3, 3.4, 3.5, 4.4

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string;
  isOffline: boolean;
  hasStrongConnection: boolean;
}

export interface NetworkError {
  type: 'NETWORK_ERROR' | 'TIMEOUT_ERROR' | 'SERVER_ERROR' | 'OFFLINE_ERROR';
  message: string;
  isRetryable: boolean;
  retryAfter?: number; // seconds
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'unknown',
    isOffline: false,
    hasStrongConnection: true,
  });

  const [networkError, setNetworkError] = useState<NetworkError | null>(null);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable ?? false;
      const connectionType = state.type || 'unknown';
      const isOffline = !isConnected || !isInternetReachable;

      // Determine connection strength based on type and details
      let hasStrongConnection = true;
      if (state.type === 'cellular' && state.details) {
        const cellularGeneration = (state.details as any).cellularGeneration;
        hasStrongConnection = cellularGeneration === '4g' || cellularGeneration === '5g';
      } else if (state.type === 'wifi' && state.details) {
        const strength = (state.details as any).strength;
        hasStrongConnection = strength > 50; // Assuming strength is 0-100
      }

      setNetworkStatus({
        isConnected,
        isInternetReachable,
        connectionType,
        isOffline,
        hasStrongConnection,
      });

      // Clear network error when connection is restored
      if (isConnected && isInternetReachable && networkError?.type === 'OFFLINE_ERROR') {
        setNetworkError(null);
      }

      // Set offline error when connection is lost
      if (isOffline && !networkError) {
        setNetworkError({
          type: 'OFFLINE_ERROR',
          message: 'You are currently offline. Please check your internet connection.',
          isRetryable: true,
        });
      }
    });

    return unsubscribe;
  }, [networkError]);

  const handleNetworkError = useCallback((error: any): NetworkError => {
    let networkError: NetworkError;

    if (error.message?.includes('Network request failed') || error.code === 'NETWORK_ERROR') {
      networkError = {
        type: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your internet connection.',
        isRetryable: true,
        retryAfter: 5,
      };
    } else if (error.message?.includes('timeout') || error.code === 'TIMEOUT_ERROR') {
      networkError = {
        type: 'TIMEOUT_ERROR',
        message: 'The request timed out. Please try again.',
        isRetryable: true,
        retryAfter: 3,
      };
    } else if (error.status >= 500 || error.code === 'SERVER_ERROR') {
      networkError = {
        type: 'SERVER_ERROR',
        message: 'Server is temporarily unavailable. Please try again later.',
        isRetryable: true,
        retryAfter: 10,
      };
    } else {
      networkError = {
        type: 'NETWORK_ERROR',
        message: 'A network error occurred. Please try again.',
        isRetryable: true,
        retryAfter: 5,
      };
    }

    setNetworkError(networkError);
    return networkError;
  }, []);

  const clearNetworkError = useCallback(() => {
    setNetworkError(null);
  }, []);

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      return Boolean(state.isConnected && state.isInternetReachable);
    } catch (error) {
      return false;
    }
  }, []);

  const waitForConnection = useCallback(async (timeout: number = 30000): Promise<boolean> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkConnection = async () => {
        const isConnected = await checkConnectivity();
        
        if (isConnected) {
          resolve(true);
          return;
        }

        if (Date.now() - startTime >= timeout) {
          resolve(false);
          return;
        }

        setTimeout(checkConnection, 1000);
      };

      checkConnection();
    });
  }, [checkConnectivity]);

  return {
    networkStatus,
    networkError,
    handleNetworkError,
    clearNetworkError,
    checkConnectivity,
    waitForConnection,
  };
}

// Hook for handling API requests with network error handling
export function useNetworkAwareRequest() {
  const { networkStatus, handleNetworkError, waitForConnection } = useNetworkStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  const executeRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      waitForConnection?: boolean;
    } = {}
  ): Promise<T> => {
    const { maxRetries = 3, retryDelay = 1000, waitForConnection: shouldWaitForConnection = true } = options;

    // Check if offline and wait for connection if requested
    if (networkStatus.isOffline && shouldWaitForConnection) {
      setIsRetrying(true);
      const connectionRestored = await waitForConnection(30000);
      setIsRetrying(false);

      if (!connectionRestored) {
        throw new Error('Unable to establish internet connection');
      }
    }

    let lastError: any;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        const result = await requestFn();
        return result;
      } catch (error) {
        lastError = error;
        
        const networkError = handleNetworkError(error);
        
        // Don't retry if error is not retryable
        if (!networkError.isRetryable) {
          throw error;
        }

        // Don't retry if we've reached max retries
        if (retryCount >= maxRetries) {
          break;
        }

        retryCount++;
        setIsRetrying(true);

        // Wait before retrying
        const delay = networkError.retryAfter ? networkError.retryAfter * 1000 : retryDelay;
        await new Promise(resolve => setTimeout(resolve, delay));

        setIsRetrying(false);
      }
    }

    throw lastError;
  }, [networkStatus.isOffline, handleNetworkError, waitForConnection]);

  return {
    executeRequest,
    isRetrying,
    networkStatus,
  };
}

export default useNetworkStatus;