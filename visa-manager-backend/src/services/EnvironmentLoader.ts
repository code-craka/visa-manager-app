import dotenv from 'dotenv';
import path from 'path';

interface BackendEnvironmentConfig {
  NODE_ENV: string;
  PLATFORM: string;
  PORT: number;
  HOST: string;
  DATABASE_URL: string;
  DATABASE_AUTHENTICATED_URL: string;
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  CLERK_JWKS_URL: string;
  CORS_ORIGIN: string;
  WEBSOCKET_PORT: number;
}

class BackendEnvironmentLoader {
  private static config: BackendEnvironmentConfig | null = null;

  static loadEnvironment(): void {
    const platform = process.env.PLATFORM || 'development';
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Load base .env file first
    dotenv.config();

    // Load platform-specific .env file
    if (platform === 'web') {
      dotenv.config({ path: path.resolve(process.cwd(), '.env.web') });
    } else if (platform === 'android') {
      dotenv.config({ path: path.resolve(process.cwd(), '.env.android') });
    } else if (nodeEnv === 'production') {
      dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
    }
  }

  static getConfig(): BackendEnvironmentConfig {
    if (this.config) {
      return this.config;
    }

    this.loadEnvironment();

    this.config = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PLATFORM: process.env.PLATFORM || 'development',
      PORT: parseInt(process.env.PORT || '3000', 10),
      HOST: process.env.HOST || 'localhost',
      DATABASE_URL: process.env.DATABASE_URL || '',
      DATABASE_AUTHENTICATED_URL: process.env.DATABASE_AUTHENTICATED_URL || '',
      CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || '',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
      CLERK_JWKS_URL: process.env.CLERK_JWKS_URL || '',
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
      WEBSOCKET_PORT: parseInt(process.env.WEBSOCKET_PORT || '3001', 10),
    };

    return this.config;
  }

  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  static isWeb(): boolean {
    return process.env.PLATFORM === 'web';
  }

  static isAndroid(): boolean {
    return process.env.PLATFORM === 'android';
  }
}

export default BackendEnvironmentLoader;