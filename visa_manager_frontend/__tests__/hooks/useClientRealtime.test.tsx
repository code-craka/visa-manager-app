import { renderHook, act } from '@testing-library/react-native';
import { useClientRealtime } from '../../src/hooks/useClientRealtime';

jest.mock('../../src/services/WebSocketService', () => ({
  WebSocketService: {
    getInstance: jest.fn(() => ({
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      isConnected: jest.fn(() => true),
    })),
  },
}));

describe('useClientRealtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useClientRealtime('test-agency-id'));

    expect(result.current.isConnected).toBe(true);
    expect(result.current.clients).toEqual([]);
    expect(result.current.stats).toBeNull();
  });

  it('handles client created event', () => {
    const { result } = renderHook(() => useClientRealtime('test-agency-id'));

    const newClient = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      visaType: 'business',
      status: 'pending',
    };

    act(() => {
      result.current.handleClientCreated({ client: newClient });
    });

    expect(result.current.clients).toContain(newClient);
  });

  it('handles client updated event', () => {
    const { result } = renderHook(() => useClientRealtime('test-agency-id'));

    const existingClient = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      visaType: 'business',
      status: 'pending',
    };

    act(() => {
      result.current.setClients([existingClient]);
    });

    const updatedClient = { ...existingClient, status: 'approved' };

    act(() => {
      result.current.handleClientUpdated({ client: updatedClient });
    });

    expect(result.current.clients[0].status).toBe('approved');
  });

  it('handles client deleted event', () => {
    const { result } = renderHook(() => useClientRealtime('test-agency-id'));

    const client = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      visaType: 'business',
      status: 'pending',
    };

    act(() => {
      result.current.setClients([client]);
    });

    act(() => {
      result.current.handleClientDeleted({ clientId: 1 });
    });

    expect(result.current.clients).toHaveLength(0);
  });
});