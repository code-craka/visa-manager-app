import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [networkType, setNetworkType] = useState<string>('unknown');

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      const unsubscribe = NetInfo.addEventListener(state => {
        setIsOnline(state.isConnected ?? false);
        setNetworkType(state.type);
      });

      return unsubscribe;
    }
  }, []);

  return { isOnline, networkType };
};