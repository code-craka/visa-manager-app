import { Platform } from 'react-native';

export class CORSService {
  private static allowedOrigins = [
    'https://visamanager.com',
    'https://www.visamanager.com',
    'https://app.visamanager.com',
    'http://localhost:3000', // Development
    'http://localhost:8081', // React Native dev
  ];

  static isOriginAllowed(origin: string): boolean {
    return this.allowedOrigins.includes(origin);
  }

  static getCORSHeaders(): Record<string, string> {
    if (Platform.OS !== 'web') return {};

    return {
      'Access-Control-Allow-Origin': window.location.origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    };
  }

  static addCORSHeaders(headers: Record<string, string>): Record<string, string> {
    return {
      ...headers,
      ...this.getCORSHeaders(),
    };
  }

  // Preflight request handler
  static handlePreflightRequest(): Response | null {
    if (Platform.OS !== 'web') return null;

    const corsHeaders = this.getCORSHeaders();
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
}