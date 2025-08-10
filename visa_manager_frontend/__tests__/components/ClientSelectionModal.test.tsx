import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import ClientSelectionModal from '../../src/components/ClientSelectionModal';
import { VisaType, ClientStatus } from '../../src/types/Client';

const mockClients = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    visaType: VisaType.BUSINESS,
    status: ClientStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    visaType: VisaType.TOURIST,
    status: ClientStatus.IN_PROGRESS,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

jest.mock('../../src/services/ApiService', () => ({
  getClientsForTaskAssignment: jest.fn(() => Promise.resolve(mockClients)),
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      {component}
    </PaperProvider>
  );
};

describe('ClientSelectionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByText } = renderWithProvider(
      <ClientSelectionModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    expect(getByText('Select Client')).toBeTruthy();
  });

  it('calls onSelect when client is selected', async () => {
    const { getByText } = renderWithProvider(
      <ClientSelectionModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });

    fireEvent.press(getByText('John Doe'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockClients[0]);
  });

  it('calls onClose when cancel button is pressed', () => {
    const { getByText } = renderWithProvider(
      <ClientSelectionModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    fireEvent.press(getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});