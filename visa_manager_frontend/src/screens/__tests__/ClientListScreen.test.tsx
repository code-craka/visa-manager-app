import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import ClientListScreen from '../ClientListScreen';
import { theme } from '../../styles/theme';

// Mock the ApiService
const mockApiService = {
  setAuthTokenGetter: jest.fn(),
  getClients: jest.fn().mockResolvedValue({
    success: true,
    data: [],
    pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 }
  }),
  deleteClient: jest.fn().mockResolvedValue({ success: true })
};

jest.mock('../../services/ApiService', () => ({
  __esModule: true,
  default: mockApiService
}));

// Mock the AuthContext
const mockAuthContext = {
  user: {
    id: 'user_123',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'agency' as const
  },
  isLoading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  syncUserWithBackend: jest.fn(),
  getAuthToken: jest.fn().mockResolvedValue('mock-token'),
  showSignIn: false,
  showSignUp: false,
  setShowSignIn: jest.fn(),
  setShowSignUp: jest.fn(),
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PaperProvider theme={{
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.primary,
      surface: theme.colors.surface,
      background: theme.colors.background,
    }
  }}>
    {children}
  </PaperProvider>
);

describe('ClientListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <TestWrapper>
        <ClientListScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    expect(screen.getByText('Loading clients...')).toBeTruthy();
  });

  it('renders search bar and filter components', async () => {
    render(
      <TestWrapper>
        <ClientListScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search clients by name, email, or visa type...')).toBeTruthy();
      expect(screen.getByText('Filter by status:')).toBeTruthy();
      expect(screen.getByText('Sort by:')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('renders empty state when no clients found', async () => {
    render(
      <TestWrapper>
        <ClientListScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No clients found')).toBeTruthy();
      expect(screen.getByText('Get started by creating your first client')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('renders FAB for creating new client', async () => {
    render(
      <TestWrapper>
        <ClientListScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Add Client')).toBeTruthy();
    }, { timeout: 3000 });
  });
});