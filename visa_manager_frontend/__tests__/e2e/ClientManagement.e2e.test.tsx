import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import React from 'react';
import ClientListScreen from '../../src/screens/ClientListScreen';
import ClientFormScreen from '../../src/screens/ClientFormScreen';
import { VisaType, ClientStatus } from '../../src/types/Client';

const mockClients = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    visaType: VisaType.BUSINESS,
    status: ClientStatus.PENDING,
    notes: 'Test client',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockStats = {
  totalClients: 1,
  pending: 1,
  approved: 0,
  inProgress: 0,
  completed: 0,
  rejected: 0,
  underReview: 0,
  documentsRequired: 0,
};

jest.mock('../../src/services/ApiService', () => ({
  getClients: jest.fn(() => Promise.resolve({ clients: mockClients, pagination: { total: 1 } })),
  getClientStats: jest.fn(() => Promise.resolve(mockStats)),
  createClient: jest.fn(() => Promise.resolve(mockClients[0])),
  updateClient: jest.fn(() => Promise.resolve({ ...mockClients[0], name: 'Updated Name' })),
  deleteClient: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../src/hooks/useClientRealtime', () => ({
  useClientRealtime: () => ({
    clients: mockClients,
    stats: mockStats,
    isConnected: true,
    setClients: jest.fn(),
    handleClientCreated: jest.fn(),
    handleClientUpdated: jest.fn(),
    handleClientDeleted: jest.fn(),
  }),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      {component}
    </PaperProvider>
  );
};

describe('Client Management E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Client Management Workflow', () => {
    it('displays client list and allows navigation to create form', async () => {
      const { getByText, getByTestId } = renderWithProvider(
        <ClientListScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText('john@example.com')).toBeTruthy();
      });

      const addButton = getByTestId('add-client-button');
      fireEvent.press(addButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ClientForm', { mode: 'create' });
    });

    it('handles client creation workflow', async () => {
      const mockRoute = {
        params: { mode: 'create' },
      };

      const { getByPlaceholderText, getByText } = renderWithProvider(
        <ClientFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const nameInput = getByPlaceholderText('Enter client name');
      const emailInput = getByPlaceholderText('Enter email address');

      fireEvent.changeText(nameInput, 'New Client');
      fireEvent.changeText(emailInput, 'new@example.com');

      const saveButton = getByText('Save Client');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });

    it('handles client editing workflow', async () => {
      const mockRoute = {
        params: { 
          mode: 'edit',
          clientId: 1,
          client: mockClients[0]
        },
      };

      const { getByDisplayValue, getByText } = renderWithProvider(
        <ClientFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const nameInput = getByDisplayValue('John Doe');
      fireEvent.changeText(nameInput, 'Updated Name');

      const saveButton = getByText('Update Client');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });

    it('displays error messages for validation failures', async () => {
      const mockRoute = {
        params: { mode: 'create' },
      };

      const { getByPlaceholderText, getByText } = renderWithProvider(
        <ClientFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const saveButton = getByText('Save Client');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByText('Name is required')).toBeTruthy();
        expect(getByText('Email is required')).toBeTruthy();
      });
    });

    it('handles network errors gracefully', async () => {
      const ApiService = require('../../src/services/ApiService');
      ApiService.getClients.mockRejectedValueOnce(new Error('Network error'));

      const { getByText } = renderWithProvider(
        <ClientListScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('Failed to load clients')).toBeTruthy();
      });
    });
  });

  describe('Real-time Updates Integration', () => {
    it('updates client list when new client is created via WebSocket', async () => {
      const { getByText } = renderWithProvider(
        <ClientListScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      const useClientRealtime = require('../../src/hooks/useClientRealtime').useClientRealtime;
      const newClient = {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        visaType: VisaType.TOURIST,
        status: ClientStatus.PENDING,
      };

      useClientRealtime().handleClientCreated({ client: newClient });

      await waitFor(() => {
        expect(getByText('Jane Smith')).toBeTruthy();
      });
    });

    it('shows connection status indicator', async () => {
      const { getByTestId } = renderWithProvider(
        <ClientListScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByTestId('connection-status-connected')).toBeTruthy();
      });
    });
  });

  describe('Form Validation and Error Handling', () => {
    it('validates email format in real-time', async () => {
      const mockRoute = {
        params: { mode: 'create' },
      };

      const { getByPlaceholderText, getByText } = renderWithProvider(
        <ClientFormScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const emailInput = getByPlaceholderText('Enter email address');
      fireEvent.changeText(emailInput, 'invalid-email');

      await waitFor(() => {
        expect(getByText('Please enter a valid email address')).toBeTruthy();
      });
    });
  });
});