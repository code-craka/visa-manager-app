// ClientSelectionModal Test Suite
// Testing client selection functionality, search, filtering, and integration

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { Provider as PaperProvider } from 'react-native-paper';
import ClientSelectionModal from '../ClientSelectionModal';
import ApiService from '../../services/ApiService';
import { Client, ClientStatus, VisaType } from '../../types/Client';

// Mock ApiService
jest.mock('../../services/ApiService', () => ({
  getClients: jest.fn(),
}));

const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

// Mock clients data
const mockClients: Client[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    visaType: VisaType.BUSINESS,
    status: ClientStatus.PENDING,
    notes: 'Urgent business visa application',
    agencyId: 'user_123',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    createdBy: 'user_123',
    updatedBy: 'user_123'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0124',
    visaType: VisaType.TOURIST,
    status: ClientStatus.IN_PROGRESS,
    notes: 'Tourist visa for vacation',
    agencyId: 'user_123',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
    createdBy: 'user_123',
    updatedBy: 'user_123'
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    phone: '+1-555-0125',
    visaType: VisaType.STUDENT,
    status: ClientStatus.APPROVED,
    agencyId: 'user_123',
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z',
    createdBy: 'user_123',
    updatedBy: 'user_123'
  }
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PaperProvider>
    {children}
  </PaperProvider>
);

describe('ClientSelectionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.getClients.mockResolvedValue({
      success: true,
      data: mockClients,
      pagination: {
        page: 1,
        limit: 100,
        totalItems: 3,
        totalPages: 1
      }
    });
  });

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    onSelect: mockOnSelect,
    excludeIds: [],
  };

  it('renders correctly when visible', async () => {
    render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} />
      </TestWrapper>
    );

    // Check if modal title is displayed
    expect(screen.getByText('Select Client')).toBeTruthy();
    expect(screen.getByText('Choose a client for task assignment')).toBeTruthy();

    // Wait for clients to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('Jane Smith')).toBeTruthy();
      expect(screen.getByText('Bob Johnson')).toBeTruthy();
    });
  });

  it('does not render when not visible', () => {
    render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} visible={false} />
      </TestWrapper>
    );

    // Modal should not be visible
    expect(screen.queryByText('Select Client')).toBeNull();
  });

  it('loads clients when modal becomes visible', async () => {
    render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockApiService.getClients).toHaveBeenCalledWith({
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc'
      });
    });
  });

  it('excludes clients with specified IDs', async () => {
    render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} excludeIds={[1, 2]} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Only Bob Johnson should be visible (ID 3)
      expect(screen.getByText('Bob Johnson')).toBeTruthy();
      expect(screen.queryByText('John Doe')).toBeNull();
      expect(screen.queryByText('Jane Smith')).toBeNull();
    });
  });

  it('filters clients by search query', async () => {
    render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} />
      </TestWrapper>
    );

    // Wait for clients to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    // Find and interact with search bar
    const searchBar = screen.getByPlaceholderText('Search clients by name, email, or visa type...');
    fireEvent.changeText(searchBar, 'john');

    // Wait for debounced search (300ms)
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.queryByText('Jane Smith')).toBeNull();
      expect(screen.queryByText('Bob Johnson')).toBeNull();
    }, { timeout: 500 });
  });

  it('filters clients by status', async () => {
    render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} />
      </TestWrapper>
    );

    // Wait for clients to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    // Click on "In Progress" filter chip
    const inProgressChip = screen.getByText('In Progress');
    fireEvent.press(inProgressChip);

    await waitFor(() => {
      // Only Jane Smith should be visible (IN_PROGRESS status)
      expect(screen.getByText('Jane Smith')).toBeTruthy();
      expect(screen.queryByText('John Doe')).toBeNull();
      expect(screen.queryByText('Bob Johnson')).toBeNull();
    });
  });

  it('selects a client and enables confirm button', async () => {
    render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} />
      </TestWrapper>
    );

    // Wait for clients to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    // Initially, select button should be disabled
    const selectButton = screen.getByText('Select Client');
    expect(selectButton).toBeTruthy();

    // Click on a client card
    const johnDoeCard = screen.getByText('John Doe');
    fireEvent.press(johnDoeCard);

    // Select button should now be enabled and clickable
    await waitFor(() => {
      fireEvent.press(selectButton);
      expect(mockOnSelect).toHaveBeenCalledWith(mockClients[0]);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('displays client information correctly', async () => {
    render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check client details are displayed
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('john.doe@example.com')).toBeTruthy();
      expect(screen.getByText('+1-555-0123')).toBeTruthy();
      expect(screen.getByText('PENDING')).toBeTruthy();
      expect(screen.getByText('BUSINESS')).toBeTruthy();
    });
  });

  it('displays visa type icons correctly', async () => {
    render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check that clients are loaded (we can't easily test icons in RNTL)
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('Jane Smith')).toBeTruthy();
      expect(screen.getByText('Bob Johnson')).toBeTruthy();
    });
  });

  it('handles API errors gracefully', async () => {
    mockApiService.getClients.mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeTruthy();
      expect(screen.getByText('Network error')).toBeTruthy();
      expect(screen.getByText('Retry')).toBeTruthy();
    });
  });

  it('shows loading state while fetching clients', async () => {
    // Mock a delayed response
    mockApiService.getClients.mockImplementation(
      () => new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          data: mockClients,
          pagination: {
            page: 1,
            limit: 100,
            totalItems: 3,
            totalPages: 1
          }
        }), 100)
      )
    );

    render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} />
      </TestWrapper>
    );

    // Should show loading state initially
    expect(screen.getByText('Loading clients...')).toBeTruthy();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });
  });

  it('shows empty state when no clients match filters', async () => {
    render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} />
      </TestWrapper>
    );

    // Wait for clients to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    // Search for non-existent client
    const searchBar = screen.getByPlaceholderText('Search clients by name, email, or visa type...');
    fireEvent.changeText(searchBar, 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText('No clients found')).toBeTruthy();
      expect(screen.getByText('Try adjusting your search or filters')).toBeTruthy();
    }, { timeout: 500 });
  });

  it('closes modal when close button is pressed', async () => {
    render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} />
      </TestWrapper>
    );

    // Find and press close button
    const closeButton = screen.getByText('Cancel');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('resets state when modal is closed', async () => {
    const { rerender } = render(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} />
      </TestWrapper>
    );

    // Wait for clients to load and select one
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    const johnDoeCard = screen.getByText('John Doe');
    fireEvent.press(johnDoeCard);

    // Close modal
    const cancelButton = screen.getByText('Cancel');
    fireEvent.press(cancelButton);

    // Reopen modal
    rerender(
      <TestWrapper>
        <ClientSelectionModal {...defaultProps} visible={true} />
      </TestWrapper>
    );

    // State should be reset (no client selected)
    await waitFor(() => {
      const selectButton = screen.getByText('Select Client');
      expect(selectButton).toBeTruthy();
      // Button should be disabled (no selection)
    });
  });

  it('uses custom title and subtitle when provided', () => {
    render(
      <TestWrapper>
        <ClientSelectionModal 
          {...defaultProps} 
          title="Custom Title"
          subtitle="Custom subtitle text"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Custom Title')).toBeTruthy();
    expect(screen.getByText('Custom subtitle text')).toBeTruthy();
  });
});