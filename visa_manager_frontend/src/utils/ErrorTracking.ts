import { Platform } from 'react-native';

interface ErrorInfo {
  message: string;
  stack?: string;
  platform: string;
  timestamp: number;
  userId?: string;
  context?: Record<string, any>;
}

class ErrorTracking {
  private static instance: ErrorTracking;
  private isInitialized = false;

  static getInstance(): ErrorTracking {
    if (!ErrorTracking.instance) {
      ErrorTracking.instance = new ErrorTracking();
    }
    return ErrorTracking.instance;
  }

  async initialize(dsn?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Platform.OS === 'web') {
        // Web Sentry initialization
        const Sentry = await import('@sentry/react');
        Sentry.init({
          dsn: dsn || process.env.REACT_APP_SENTRY_DSN,
          environment: process.env.NODE_ENV,
          tracesSampleRate: 0.1,
        });
      } else {
        // React Native Sentry initialization
        const Sentry = await import('@sentry/react-native');
        Sentry.init({
          dsn: dsn || process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV,
        });
      }
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize error tracking:', error);
    }
  }

  captureError(error: Error, context?: Record<string, any>): void {
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      platform: Platform.OS,
      timestamp: Date.now(),
      context,
    };

    // Log to console for development
    if (__DEV__) {
      console.error('Error captured:', errorInfo);
    }

    // Send to Sentry if initialized
    if (this.isInitialized) {
      this.sendToSentry(error, context);
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (__DEV__) {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }

    if (this.isInitialized) {
      this.sendMessageToSentry(message, level);
    }
  }

  setUser(userId: string, email?: string): void {
    if (this.isInitialized) {
      this.setSentryUser(userId, email);
    }
  }

  private async sendToSentry(error: Error, context?: Record<string, any>): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        const Sentry = await import('@sentry/react');
        Sentry.withScope((scope) => {
          if (context) {
            scope.setContext('additional', context);
          }
          Sentry.captureException(error);
        });
      } else {
        const Sentry = await import('@sentry/react-native');
        Sentry.withScope((scope) => {
          if (context) {
            scope.setContext('additional', context);
          }
          Sentry.captureException(error);
        });
      }
    } catch (err) {
      console.warn('Failed to send error to Sentry:', err);
    }
  }

  private async sendMessageToSentry(message: string, level: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        const Sentry = await import('@sentry/react');
        Sentry.captureMessage(message, level as any);
      } else {
        const Sentry = await import('@sentry/react-native');
        Sentry.captureMessage(message, level as any);
      }
    } catch (err) {
      console.warn('Failed to send message to Sentry:', err);
    }
  }

  private async setSentryUser(userId: string, email?: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        const Sentry = await import('@sentry/react');
        Sentry.setUser({ id: userId, email });
      } else {
        const Sentry = await import('@sentry/react-native');
        Sentry.setUser({ id: userId, email });
      }
    } catch (err) {
      console.warn('Failed to set Sentry user:', err);
    }
  }
}

export default ErrorTracking.getInstance();