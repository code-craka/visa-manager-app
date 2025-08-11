import { Platform } from 'react-native';

interface WebVitalsMetric {
  name: string;
  value: number;
  id: string;
}

export const reportWebVitals = (onPerfEntry?: (metric: WebVitalsMetric) => void) => {
  if (Platform.OS !== 'web' || !onPerfEntry) return;

  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(onPerfEntry);
    getFID(onPerfEntry);
    getFCP(onPerfEntry);
    getLCP(onPerfEntry);
    getTTFB(onPerfEntry);
  }).catch(() => {
    // Fallback performance tracking
    if (window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      onPerfEntry({
        name: 'page-load',
        value: navigation.loadEventEnd - navigation.fetchStart,
        id: 'page-load'
      });
    }
  });
};