import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import ClientListScreen from '../../src/screens/ClientListScreen';
import TaskAssignmentScreen from '../../src/screens/TaskAssignmentScreen';
import DashboardScreen from '../../src/screens/DashboardScreen';
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

jest.mock('../../src/services/ApiService', () => ({
  getClients: jest.fn(() => Promise.resolve({ success: true, data: mockClients, pagination: { total: 1 } })),
  getClientStats: jest.fn(() => Promise.resolve({ totalClients: 1, pending: 1 })),
  getDashboardStats: jest.fn(() => Promise.resolve({ totalClients: 1, pendingTasks: 0 })),
  getTasks: jest.fn(() => Promise.resolve([])),
  getNotifications: jest.fn(() => Promise.resolve([])),
  getPartners: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', role: 'agency', displayName: 'Test User' },
    getAuthToken: jest.fn(() => Promise.resolve('mock-token')),
    signOut: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useClientRealtime', () => ({
  useClientRealtime: () => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    isConnected: true,
  }),
}));

const Stack = createStackNavigator();

const TestNavigator = ({ initialRouteName = 'Dashboard' }) => (
  <PaperProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="ClientList" component={ClientListScreen} />
        <Stack.Screen name="TaskAssignment" component={TaskAssignmentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </PaperProvider>
);

describe('Navigation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard Navigation', () => {
    it('navigates to client management from dashboard', async () => {
      const { getByText } = render(<TestNavigator />);

      await waitFor(() => {
        expect(getByText('Manage Clients')).toBeTruthy();
      });

      fireEvent.press(getByText('Manage Clients'));

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });
    });

    it('navigates to task assignment from dashboard', async () => {
      const { getByText } = render(<TestNavigator />);

      await waitFor(() => {
        expect(getByText('New Task')).toBeTruthy();
      });

      fireEvent.press(getByText('New Task'));

      await waitFor(() => {
        expect(getByText('Task Assignment')).toBeTruthy();
      });
    });
  });

  describe('Client List Navigation', () => {
    it('navigates to task assignment with pre-selected client', async () => {
      const { getByTestId } = render(<TestNavigator initialRouteName="ClientList" />);

      await waitFor(() => {
        expect(getByTestId('assign-task-1')).toBeTruthy();
      });

      fireEvent.press(getByTestId('assign-task-1'));

      await waitFor(() => {
        expect(getByText('Assigning task for John Doe')).toBeTruthy();
      });
    });
  });

  describe('Task Assignment Navigation', () => {
    it('handles pre-selected client from navigation params', async () => {
      const TestNavigatorWithParams = () => (
        <PaperProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="TaskAssignment">
              <Stack.Screen 
                name="TaskAssignment" 
                component={TaskAssignmentScreen}
                initialParams={{
                  selectedClient: mockClients[0],
                  clientId: 1
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      );

      const { getByText } = render(<TestNavigatorWithParams />);

      await waitFor(() => {
        expect(getByText('Assigning task for John Doe')).toBeTruthy();
        expect(getByText('Selected: John Doe')).toBeTruthy();
      });
    });
  });
});