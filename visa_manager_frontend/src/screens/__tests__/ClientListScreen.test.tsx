import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import ClientListScreen from '../ClientListScreen';
import { theme } from '../../styles/theme';
import { Client, ClientStatus, VisaType } from '../../types/Client';

// Mock client data for testing
const mockClient: Client = {
  id: 1,
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  visaType: VisaType.BUSINESS,
  status: ClientStatus.PENDING,
  notes: 'Test client',
  agencyId: 'user_123',
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  createdBy: 'user_123',
  updatedBy: 'user_123'
};

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

  describe('Client Deletion Functionality', () => {
    beforeEach(() => {
      // Reset mocks and set up client data
      jest.clearAllMocks();
      mockApiService.getClients.mockResolvedValue({
        success: true,
        data: [mockClient],
        pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 }
      });
    });

    it('shows delete confirmation dialog when delete button is pressed', async () => {
      render(
        <TestWrapper>
          <ClientListScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      // Wait for client to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      }, { timeout: 3000 });

      // Find and press delete button
      const deleteButton = screen.getByTestId('delete-client-1') || screen.getAllByText('delete')[0];
      fireEvent.press(deleteButton);

      // Check if dialog appears
      await waitFor(() => {
        expect(screen.getByText('Delete Client')).toBeTruthy();
        expect(screen.getByText(/Are you sure you want to permanently delete this client/)).toBeTruthy();
      });
    });

    it('displays client details in delete confirmation dialog', async () => {
      render(
        <TestWrapper>
          <ClientListScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      // Wait for client to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      }, { timeout: 3000 });

      // Find and press delete button
      const deleteButton = screen.getByTestId('delete-client-1') || screen.getAllByText('delete')[0];
      fireEvent.press(deleteButton);

      // Check if client details are shown in dialog
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('john.doe@example.com')).toBeTruthy();
        expect(screen.getByText('+1-555-0123')).toBeTruthy();
        expect(screen.getByText('BUSINESS')).toBeTruthy();
        expect(screen.getByText('PENDING')).toBeTruthy();
      });
    });

    it('successfully deletes client when confirmed', async () => {
      mockApiService.deleteClient.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <ClientListScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      // Wait for client to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      }, { timeout: 3000 });

      // Find and press delete button
      const deleteButton = screen.getByTestId('delete-client-1') || screen.getAllByText('delete')[0];
      fireEvent.press(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        const confirmButton = screen.getByText('Delete Client');
        fireEvent.press(confirmButton);
      });

      // Check if API was called
      await waitFor(() => {
        expect(mockApiService.deleteClient).toHaveBeenCalledWith(1);
      });
    });

    it('shows error message when deletion fails due to active tasks', async () => {
      mockApiService.deleteClient.mockRejectedValue(
        new Error('Cannot delete client with active tasks')
      );

      render(
        <TestWrapper>
          <ClientListScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      // Wait for client to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      }, { timeout: 3000 });

      // Find and press delete button
      const deleteButton = screen.getByTestId('delete-client-1') || screen.getAllByText('delete')[0];
      fireEvent.press(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        const confirmButton = screen.getByText('Delete Client');
        fireEvent.press(confirmButton);
      });

      // Check if error message is shown
      await waitFor(() => {
        expect(screen.getByText(/Cannot delete.*because they have active tasks/)).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('shows success message when client is deleted successfully', async () => {
      mockApiService.deleteClient.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <ClientListScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      // Wait for client to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      }, { timeout: 3000 });

      // Find and press delete button
      const deleteButton = screen.getByTestId('delete-client-1') || screen.getAllByText('delete')[0];
      fireEvent.press(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        const confirmButton = screen.getByText('Delete Client');
        fireEvent.press(confirmButton);
      });

      // Check if success message is shown
      await waitFor(() => {
        expect(screen.getByText(/Client "John Doe" deleted successfully/)).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('cancels deletion when cancel button is pressed', async () => {
      render(
        <TestWrapper>
          <ClientListScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      // Wait for client to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      }, { timeout: 3000 });

      // Find and press delete button
      const deleteButton = screen.getByTestId('delete-client-1') || screen.getAllByText('delete')[0];
      fireEvent.press(deleteButton);

      // Cancel deletion
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.press(cancelButton);
      });

      // Check if API was not called
      expect(mockApiService.deleteClient).not.toHaveBeenCalled();
    });

    it('handles network errors gracefully', async () => {
      mockApiService.deleteClient.mockRejectedValue(
        new Error('Network error occurred')
      );

      render(
        <TestWrapper>
          <ClientListScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      // Wait for client to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      }, { timeout: 3000 });

      // Find and press delete button
      const deleteButton = screen.getByTestId('delete-client-1') || screen.getAllByText('delete')[0];
      fireEvent.press(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        const confirmButton = screen.getByText('Delete Client');
        fireEvent.press(confirmButton);
      });

      // Check if error message is shown
      await waitFor(() => {
        expect(screen.getByText('Network error occurred')).toBeTruthy();
      }, { timeout: 3000 });
    });
  });
});