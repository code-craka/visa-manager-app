import { PlatformUtils } from './PlatformUtils';

interface PlatformConfig {
  apiBaseUrl: string;
  storagePrefix: string;
  maxRetries: number;
  timeout: number;
  enableAnalytics: boolean;
  enablePushNotifications: boolean;
}

export class PlatformManager {
  private static instance: PlatformManager;
  private config: PlatformConfig;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  static getInstance(): PlatformManager {
    if (!PlatformManager.instance) {
      PlatformManager.instance = new PlatformManager();
    }
    return PlatformManager.instance;
  }

  private getDefaultConfig(): PlatformConfig {
    return PlatformUtils.select({
      web: {
        apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
        storagePrefix: 'visa_manager_web_',
        maxRetries: 3,
        timeout: 10000,
        enableAnalytics: true,
        enablePushNotifications: false,
      },
      native: {
        apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
        storagePrefix: 'visa_manager_native_',
        maxRetries: 5,
        timeout: 15000,
        enableAnalytics: true,
        enablePushNotifications: true,
      },
      default: {
        apiBaseUrl: 'http://localhost:3001',
        storagePrefix: 'visa_manager_',
        maxRetries: 3,
        timeout: 10000,
        enableAnalytics: false,
        enablePushNotifications: false,
      },
    }) as PlatformConfig;
  }

  getConfig(): PlatformConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<PlatformConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getApiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  getStoragePrefix(): string {
    return this.config.storagePrefix;
  }

  getMaxRetries(): number {
    return this.config.maxRetries;
  }

  getTimeout(): number {
    return this.config.timeout;
  }

  isAnalyticsEnabled(): boolean {
    return this.config.enableAnalytics;
  }

  isPushNotificationsEnabled(): boolean {
    return this.config.enablePushNotifications;
  }
}