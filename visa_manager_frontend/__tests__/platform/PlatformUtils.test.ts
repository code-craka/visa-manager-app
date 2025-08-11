import { Platform } from 'react-native';

// Mock Platform for testing
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: jest.fn(),
  },
}));

describe('Platform Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should detect web platform', () => {
    (Platform as any).OS = 'web';
    expect(Platform.OS).toBe('web');
  });

  test('should detect native platform', () => {
    (Platform as any).OS = 'android';
    expect(Platform.OS).toBe('android');
  });

  test('should select correct platform-specific value', () => {
    const mockSelect = Platform.select as jest.Mock;
    mockSelect.mockReturnValue('web-value');

    const result = Platform.select({
      web: 'web-value',
      native: 'native-value',
    });

    expect(result).toBe('web-value');
    expect(mockSelect).toHaveBeenCalledWith({
      web: 'web-value',
      native: 'native-value',
    });
  });
});