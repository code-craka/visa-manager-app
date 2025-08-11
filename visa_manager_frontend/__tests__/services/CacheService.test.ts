import CacheService from '../../src/services/CacheService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock localStorage for web
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should set and get cache item', async () => {
    const testData = { test: 'data' };
    await CacheService.set('test-key', testData);
    
    const result = await CacheService.get('test-key');
    expect(result).toEqual(testData);
  });

  test('should return null for expired cache item', async () => {
    const testData = { test: 'data' };
    await CacheService.set('test-key', testData, 1000);
    
    jest.advanceTimersByTime(2000);
    
    const result = await CacheService.get('test-key');
    expect(result).toBeNull();
  });

  test('should remove cache item', async () => {
    const testData = { test: 'data' };
    await CacheService.set('test-key', testData);
    await CacheService.remove('test-key');
    
    const result = await CacheService.get('test-key');
    expect(result).toBeNull();
  });
});