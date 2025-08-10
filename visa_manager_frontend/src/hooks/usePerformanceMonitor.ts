// usePerformanceMonitor - Hook for monitoring client management performance
// Requirements: 2.1, 2.2, 2.3, 8.2

import { useEffect, useRef, useCallback } from 'react';
import { clientCacheService } from '../services/ClientCacheService';

interface PerformanceMetrics {
  renderTime: number;
  apiCallTime: number;
  cacheHitRate: number;
  memoryUsage: number;
}

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(Date.now());
  const apiCallTimes = useRef<number[]>([]);
  const cacheHits = useRef<number>(0);
  const cacheMisses = useRef<number>(0);

  // Track component render time
  const trackRenderStart = useCallback(() => {
    renderStartTime.current = Date.now();
  }, []);

  const trackRenderEnd = useCallback(() => {
    const renderTime = Date.now() - renderStartTime.current;
    
    if (__DEV__) {
      console.log(`[Performance] ${componentName} render time: ${renderTime}ms`);
    }
    
    return renderTime;
  }, [componentName]);

  // Track API call performance
  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    callName: string
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      apiCallTimes.current.push(duration);
      
      if (__DEV__) {
        console.log(`[Performance] ${callName} API call: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      apiCallTimes.current.push(duration);
      
      if (__DEV__) {
        console.log(`[Performance] ${callName} API call (failed): ${duration}ms`);
      }
      
      throw error;
    }
  }, []);

  // Track cache performance
  const trackCacheHit = useCallback(() => {
    cacheHits.current += 1;
    
    if (__DEV__) {
      const hitRate = (cacheHits.current / (cacheHits.current + cacheMisses.current)) * 100;
      console.log(`[Performance] Cache hit rate: ${hitRate.toFixed(1)}%`);
    }
  }, []);

  const trackCacheMiss = useCallback(() => {
    cacheMisses.current += 1;
    
    if (__DEV__) {
      const hitRate = (cacheHits.current / (cacheHits.current + cacheMisses.current)) * 100;
      console.log(`[Performance] Cache hit rate: ${hitRate.toFixed(1)}%`);
    }
  }, []);

  // Get performance metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    const avgApiCallTime = apiCallTimes.current.length > 0 
      ? apiCallTimes.current.reduce((a, b) => a + b, 0) / apiCallTimes.current.length 
      : 0;
    
    const cacheHitRate = (cacheHits.current + cacheMisses.current) > 0
      ? (cacheHits.current / (cacheHits.current + cacheMisses.current)) * 100
      : 0;

    const cacheStats = clientCacheService.getCacheStats();
    const memoryUsage = cacheStats.clientCacheSize + cacheStats.clientListCacheSize + cacheStats.clientStatsCacheSize;

    return {
      renderTime: Date.now() - renderStartTime.current,
      apiCallTime: avgApiCallTime,
      cacheHitRate,
      memoryUsage
    };
  }, []);

  // Log performance summary on unmount
  useEffect(() => {
    return () => {
      if (__DEV__) {
        const metrics = getMetrics();
        console.log(`[Performance Summary] ${componentName}:`, {
          avgRenderTime: `${metrics.renderTime}ms`,
          avgApiCallTime: `${metrics.apiCallTime.toFixed(1)}ms`,
          cacheHitRate: `${metrics.cacheHitRate.toFixed(1)}%`,
          cacheMemoryUsage: `${metrics.memoryUsage} entries`
        });
      }
    };
  }, [componentName, getMetrics]);

  // Monitor memory usage and clean up if needed
  useEffect(() => {
    const interval = setInterval(() => {
      const cacheStats = clientCacheService.getCacheStats();
      const totalEntries = cacheStats.clientCacheSize + cacheStats.clientListCacheSize + cacheStats.clientStatsCacheSize;
      
      // Clean up if cache gets too large (more than 1000 entries)
      if (totalEntries > 1000) {
        clientCacheService.clearExpiredEntries();
        
        if (__DEV__) {
          console.log(`[Performance] Cache cleanup performed. Entries before: ${totalEntries}, after: ${clientCacheService.getCacheStats().clientCacheSize + clientCacheService.getCacheStats().clientListCacheSize + clientCacheService.getCacheStats().clientStatsCacheSize}`);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Performance observer for React Native (if available)
  useEffect(() => {
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          if (entry.name.includes(componentName)) {
            if (__DEV__) {
              console.log(`[Performance Observer] ${entry.name}: ${entry.duration}ms`);
            }
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['measure'] });
      } catch (error) {
        // Performance Observer not supported
      }

      return () => {
        try {
          observer.disconnect();
        } catch (error) {
          // Observer already disconnected
        }
      };
    }
  }, [componentName]);

  return {
    trackRenderStart,
    trackRenderEnd,
    trackApiCall,
    trackCacheHit,
    trackCacheMiss,
    getMetrics
  };
};

// Hook for measuring component render performance
export const useRenderPerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    lastRenderTime.current = currentTime;

    if (__DEV__ && renderCount.current > 1) {
      console.log(`[Render Performance] ${componentName} re-render #${renderCount.current}, time since last: ${timeSinceLastRender}ms`);
    }
  });

  return {
    renderCount: renderCount.current
  };
};

// Hook for measuring list performance
export const useListPerformance = (listName: string, itemCount: number) => {
  const previousItemCount = useRef(itemCount);

  useEffect(() => {
    if (previousItemCount.current !== itemCount) {
      const change = itemCount - previousItemCount.current;
      
      if (__DEV__) {
        console.log(`[List Performance] ${listName} items changed: ${change > 0 ? '+' : ''}${change} (total: ${itemCount})`);
      }
      
      previousItemCount.current = itemCount;
    }
  }, [listName, itemCount]);

  return {
    itemCount,
    itemCountChange: itemCount - previousItemCount.current
  };
};

export default usePerformanceMonitor;