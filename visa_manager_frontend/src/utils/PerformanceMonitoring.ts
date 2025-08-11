import { Platform } from 'react-native';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  platform: string;
}

class PerformanceMonitoring {
  private static instance: PerformanceMonitoring;
  private metrics: PerformanceMetric[] = [];

  static getInstance(): PerformanceMonitoring {
    if (!PerformanceMonitoring.instance) {
      PerformanceMonitoring.instance = new PerformanceMonitoring();
    }
    return PerformanceMonitoring.instance;
  }

  startTiming(name: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.recordMetric(name, duration);
    };
  }

  recordMetric(name: string, value: number): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      platform: Platform.OS,
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    if (__DEV__) {
      console.log(`Performance: ${name} = ${value}ms`);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  // Web-specific performance monitoring
  measureWebVitals(): void {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Measure page load time
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      this.recordMetric('page_load_time', pageLoadTime);
    }

    // Measure First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.recordMetric('first_contentful_paint', entry.startTime);
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch (error) {
        console.warn('Failed to observe paint metrics:', error);
      }
    }
  }

  // React Native specific performance monitoring
  measureNativePerformance(): void {
    if (Platform.OS === 'web') return;

    // Measure JS bundle load time
    const bundleLoadTime = Date.now() - (global as any).__BUNDLE_START_TIME__;
    if (bundleLoadTime > 0) {
      this.recordMetric('bundle_load_time', bundleLoadTime);
    }
  }

  // Memory usage monitoring
  measureMemoryUsage(): void {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric('memory_used', memory.usedJSHeapSize);
      this.recordMetric('memory_total', memory.totalJSHeapSize);
      this.recordMetric('memory_limit', memory.jsHeapSizeLimit);
    }
  }
}

export default PerformanceMonitoring.getInstance();