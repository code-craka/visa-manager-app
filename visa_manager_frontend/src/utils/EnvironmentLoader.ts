import { Platform } from 'react-native';

interface EnvironmentConfig {
  API_BASE_URL: string;
  WS_URL: string;
  CLERK_PUBLISHABLE_KEY: string;
  PLATFORM: string;
  ENABLE_ANALYTICS?: boolean;
  ENABLE_PWA?: boolean;
}

class EnvironmentLoader {
  private static config: EnvironmentConfig | null = null;

  static getConfig(): EnvironmentConfig {
    if (this.config) {
      return this.config;
    }

    const isWeb = Platform.OS === 'web';
    const isAndroid = Platform.OS === 'android';

    // Load platform-specific configuration
    if (isWeb) {
      this.config = {
        API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api',
        WS_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:3001',
        CLERK_PUBLISHABLE_KEY: process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || '',
        PLATFORM: 'web',
        ENABLE_PWA: process.env.REACT_APP_ENABLE_PWA === 'true',
        ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
      };
    } else if (isAndroid) {
      this.config = {
        API_BASE_URL: process.env.API_BASE_URL || 'http://10.0.2.2:3000/api',
        WS_URL: process.env.WS_URL || 'ws://10.0.2.2:3001',
        CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || '',
        PLATFORM: 'android',
      };
    } else {
      // Default/fallback configuration
      this.config = {
        API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api',
        WS_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:3001',
        CLERK_PUBLISHABLE_KEY: process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || '',
        PLATFORM: Platform.OS,
      };
    }

    return this.config;
  }

  static isWeb(): boolean {
    return Platform.OS === 'web';
  }

  static isAndroid(): boolean {
    return Platform.OS === 'android';
  }

  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}

export default EnvironmentLoader;