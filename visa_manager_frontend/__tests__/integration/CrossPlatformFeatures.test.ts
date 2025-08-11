import { Platform } from 'react-native';
import { webSocketService } from '../../src/services/WebSocketService';
import CacheService from '../../src/services/CacheService';
import { SecurityUtils } from '../../src/utils/SecurityUtils';

// Mock platform detection
jest.mock('react-native', () => ({
  Platform: { OS: 'web', select: jest.fn() },
}));

describe('Cross-Platform Features Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    test('should handle authentication across platforms', async () => {
      const mockToken = 'mock-jwt-token';
      
      await SecurityUtils.storeSecureToken('auth_token', mockToken);
      const storedToken = await SecurityUtils.getSecureToken('auth_token');
      
      expect(storedToken).toBe(mockToken);
    });

    test('should validate input sanitization', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = SecurityUtils.sanitizeHtml(maliciousInput);
      
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });
  });

  describe('Real-time Functionality', () => {
    test('should establish WebSocket connection', async () => {
      const mockToken = 'test-token';
      
      global.WebSocket = jest.fn().mockImplementation(() => ({
        readyState: 1,
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
      }));

      await webSocketService.connect(mockToken);
      expect(webSocketService.isConnected()).toBe(true);
    });
  });

  describe('Data Synchronization', () => {
    test('should cache data across platforms', async () => {
      const testData = { id: 1, name: 'Test Data' };
      
      await CacheService.set('test-key', testData);
      const cachedData = await CacheService.get('test-key');
      
      expect(cachedData).toEqual(testData);
    });
  });

  describe('Platform-Specific Behavior', () => {
    test('should adapt to web platform', () => {
      (Platform as any).OS = 'web';
      
      const webValue = Platform.select({
        web: 'web-specific',
        native: 'native-specific',
      });
      
      expect(webValue).toBe('web-specific');
    });
  });
});