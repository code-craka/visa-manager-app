// ClientFormScreen Tests
// Testing form validation, submission, and navigation handling

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import ClientFormScreen from '../ClientFormScreen';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/ApiService';
import { VisaType, ClientStatus } from '../../types/Client';

// Mock the ApiService
jest.mock('../../services/ApiService', () => ({
  __esModule: true,
  default: {
    getClientById: jest.fn(),
    createClient: jest.fn(),
    updateClient: jest.fn(),
    setAuthTokenGetter: jest.fn(),
  },
}));

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {
    mode: 'create' as const,
  },
};

// Mock auth context
const mockAuthContext = {
  user: {
    id: 'user_123',
    email: 'test@example.com',
    role: 'agency' as const,
    displayName: 'Test User',
  },
  getAuthToken: jest.fn().mockResolvedValue('mock-token'),
  isLoading: false,
  signOut: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  syncUserWithBackend: jest.fn(),
  showSignIn: false,
  showSignUp: false,
  setShowSignIn: jest.fn(),
  setShowSignUp: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  // Setup the useAuth mock
  (useAuth as jest.Mock).mockReturnValue(mockAuthContext);
  
  return render(
    <PaperProvider>
      {component}
    </PaperProvider>
  );
};

describe('ClientFormScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders create form correctly', () => {
      renderWithProviders(
        <ClientFormScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(screen.getByText('New Client')).toBeTruthy();
      expect(screen.getByDisplayValue('')).toBeTruthy(); // Empty name field
      expect(screen.getByText('Create Client')).toBeTruthy();
    });

    it('validates required fields', async () => {
      renderWithProviders(
        <ClientFormScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Try to submit without filling required fields
      const submitButton = screen.getByText('Create Client');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeTruthy();
        expect(screen.getByText('Email is required')).toBeTruthy();
      });
    });

    it('validates email format', async () => {
      renderWithProviders(
        <ClientFormScreen navigation={mockNavigation} route={mockRoute} />
      );

      const emailInput = screen.getByLabelText('Email Address *');
      fireEvent.changeText(emailInput, 'invalid-email');

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      });
    });

    it('validates name format', async () => {
      renderWithProviders(
        <ClientFormScreen navigation={mockNavigation} route={mockRoute} />
      );

      const nameInput = screen.getByLabelText('Full Name *');
      fireEvent.changeText(nameInput, 'A'); // Too short

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeTruthy();
      });

      fireEvent.changeText(nameInput, 'John123'); // Invalid characters

      await waitFor(() => {
        expect(screen.getByText('Name can only contain letters, spaces, hyphens, and apostrophes')).toBeTruthy();
      });
    });

    it('validates phone number format', async () => {
      renderWithProviders(
        <ClientFormScreen navigation={mockNavigation} route={mockRoute} />
      );

      const phoneInput = screen.getByLabelText('Phone Number');
      fireEvent.changeText(phoneInput, 'invalid-phone');

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeTruthy();
      });
    });

    it('validates notes length', async () => {
      renderWithProviders(
        <ClientFormScreen navigation={mockNavigation} route={mockRoute} />
      );

      const notesInput = screen.getByLabelText('Additional Notes');
      const longNotes = 'a'.repeat(2001); // Exceeds 2000 character limit
      fireEvent.changeText(notesInput, longNotes);

      await waitFor(() => {
        expect(screen.getByText('Notes must not exceed 2000 characters')).toBeTruthy();
      });
    });

    it('submits valid form data', async () => {
      const mockCreateResponse = {
        success: true,
        data: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          visaType: VisaType.BUSINESS,
          status: ClientStatus.PENDING,
          notes: 'Test notes',
        },
      };

      (ApiService.createClient as jest.Mock).mockResolvedValue(mockCreateResponse);

      renderWithProviders(
        <ClientFormScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Fill in valid form data
      fireEvent.changeText(screen.getByLabelText('Full Name *'), 'John Doe');
      fireEvent.changeText(screen.getByLabelText('Email Address *'), 'john@example.com');
      fireEvent.changeText(screen.getByLabelText('Phone Number'), '+1234567890');
      fireEvent.changeText(screen.getByLabelText('Additional Notes'), 'Test notes');

      // Submit form
      const submitButton = screen.getByText('Create Client');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(ApiService.createClient).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          visaType: VisaType.TOURIST, // Default value
          status: ClientStatus.PENDING, // Default value
          notes: 'Test notes',
        });
      });

      // Should show success message and navigate back
      await waitFor(() => {
        expect(screen.getByText('Client created successfully')).toBeTruthy();
      });
    });
  });

  describe('Edit Mode', () => {
    const editRoute = {
      params: {
        clientId: 1,
        mode: 'edit' as const,
      },
    };

    const mockClient = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      visaType: VisaType.BUSINESS,
      status: ClientStatus.IN_PROGRESS,
      notes: 'Existing notes',
      agencyId: 'user_123',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user_123',
      updatedBy: 'user_123',
    };

    it('loads existing client data', async () => {
      const mockGetResponse = {
        success: true,
        data: mockClient,
      };

      (ApiService.getClientById as jest.Mock).mockResolvedValue(mockGetResponse);

      renderWithProviders(
        <ClientFormScreen navigation={mockNavigation} route={editRoute} />
      );

      await waitFor(() => {
        expect(ApiService.getClientById).toHaveBeenCalledWith(1);
        expect(screen.getByDisplayValue('John Doe')).toBeTruthy();
        expect(screen.getByDisplayValue('john@example.com')).toBeTruthy();
        expect(screen.getByDisplayValue('+1234567890')).toBeTruthy();
        expect(screen.getByDisplayValue('Existing notes')).toBeTruthy();
      });

      expect(screen.getByText('Edit Client')).toBeTruthy();
      expect(screen.getByText('Update Client')).toBeTruthy();
    });

    it('updates existing client', async () => {
      const mockGetResponse = {
        success: true,
        data: mockClient,
      };

      const mockUpdateResponse = {
        success: true,
        data: { ...mockClient, name: 'John Smith' },
      };

      (ApiService.getClientById as jest.Mock).mockResolvedValue(mockGetResponse);
      (ApiService.updateClient as jest.Mock).mockResolvedValue(mockUpdateResponse);

      renderWithProviders(
        <ClientFormScreen navigation={mockNavigation} route={editRoute} />
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeTruthy();
      });

      // Update the name
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.changeText(nameInput, 'John Smith');

      // Submit form
      const submitButton = screen.getByText('Update Client');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(ApiService.updateClient).toHaveBeenCalledWith(1, {
          name: 'John Smith',
          email: 'john@example.com',
          phone: '+1234567890',
          visaType: VisaType.BUSINESS,
          status: ClientStatus.IN_PROGRESS,
          notes: 'Existing notes',
        });
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Client updated successfully')).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('handles back navigation without changes', () => {
      renderWithProviders(
        <ClientFormScreen navigation={mockNavigation} route={mockRoute} />
      );

      const backButton = screen.getByTestId('appbar-back-action');
      fireEvent.press(backButton);

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('shows unsaved changes dialog when navigating back with changes', async () => {
      renderWithProviders(
        <ClientFormScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Make a change to the form
      const nameInput = screen.getByLabelText('Full Name *');
      fireEvent.changeText(nameInput, 'John Doe');

      // Try to navigate back
      const backButton = screen.getByTestId('appbar-back-action');
      fireEvent.press(backButton);

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeTruthy();
        expect(screen.getByText('You have unsaved changes. Are you sure you want to leave without saving?')).toBeTruthy();
      });
    });
  });

  const mockClient = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    visaType: VisaType.BUSINESS,
    status: ClientStatus.IN_PROGRESS,
    notes: 'Existing notes',
    agencyId: 'user_123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'user_123',
    updatedBy: 'user_123',
  };

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Network error',
      };

      (ApiService.createClient as jest.Mock).mockResolvedValue(mockErrorResponse);

      renderWithProviders(
        <ClientFormScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Fill in valid form data
      fireEvent.changeText(screen.getByLabelText('Full Name *'), 'John Doe');
      fireEvent.changeText(screen.getByLabelText('Email Address *'), 'john@example.com');

      // Submit form
      const submitButton = screen.getByText('Create Client');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeTruthy();
      });
    });

    it('handles loading state correctly', async () => {
      const editRoute = {
        params: {
          clientId: 1,
          mode: 'edit' as const,
        },
      };

      // Mock a delayed response
      (ApiService.getClientById as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockClient,
        }), 100))
      );

      renderWithProviders(
        <ClientFormScreen navigation={mockNavigation} route={editRoute} />
      );

      expect(screen.getByText('Loading client data...')).toBeTruthy();
    });
  });
});