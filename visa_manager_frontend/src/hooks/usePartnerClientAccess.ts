// Hook for Partner Client Access - Manages restricted client data access for partners
// Requirements: 6.1, 6.2, 6.3, 6.4 - Partner access controls and authorization checks

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';

import { RestrictedClient } from '../types/Client';
import ApiService from '../services/ApiService';
import { useAuth } from '../context/AuthContext';

interface UsePartnerClientAccessResult {
  clients: RestrictedClient[];
  loading: boolean;
  error: string | null;
  refreshClients: () => Promise<void>;
  getClientById: (clientId: number, taskId?: number) => Promise<RestrictedClient | null>;
  getClientForTask: (clientId: number, taskId: number) => Promise<Partial<RestrictedClient> | null>;
  hasAccess: boolean;
}

export const usePartnerClientAccess = (): UsePartnerClientAccessResult => {
  const { user } = useAuth();
  const [clients, setClients] = useState<RestrictedClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has partner access
  const hasAccess = user?.role === 'partner';

  // Load accessible clients
  const loadClients = useCallback(async () => {
    if (!hasAccess) {
      setError('Access denied: Partner role required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await ApiService.getPartnerAccessibleClients();

      if (response.success) {
        setClients(response.data);
      } else {
        setError(response.error || 'Failed to load accessible clients');
        
        // Handle specific error cases
        if (response.errorCode === 'UNAUTHORIZED') {
          Alert.alert(
            'Access Denied',
            'You do not have permission to access client information. Please contact your administrator.'
          );
        }
      }
    } catch (err) {
      const errorMessage = 'Network error: Unable to load clients';
      setError(errorMessage);
      console.error('Error loading partner accessible clients:', err);
    } finally {
      setLoading(false);
    }
  }, [hasAccess]);

  // Refresh clients
  const refreshClients = useCallback(async () => {
    await loadClients();
  }, [loadClients]);

  // Get specific client by ID with partner access validation
  const getClientById = useCallback(async (
    clientId: number, 
    taskId?: number
  ): Promise<RestrictedClient | null> => {
    if (!hasAccess) {
      Alert.alert('Access Denied', 'Partner role required');
      return null;
    }

    try {
      const response = await ApiService.getPartnerClientById(clientId, taskId);

      if (response.success) {
        return response.data;
      } else {
        // Handle specific error cases
        if (response.errorCode === 'UNAUTHORIZED') {
          Alert.alert(
            'Access Denied',
            'You do not have access to this client. Access is only granted through assigned tasks.'
          );
        } else {
          Alert.alert('Error', response.error || 'Failed to load client details');
        }
        return null;
      }
    } catch (err) {
      console.error('Error loading client by ID:', err);
      Alert.alert('Error', 'Network error: Unable to load client details');
      return null;
    }
  }, [hasAccess]);

  // Get client for task context (minimal data)
  const getClientForTask = useCallback(async (
    clientId: number, 
    taskId: number
  ): Promise<Partial<RestrictedClient> | null> => {
    if (!hasAccess) {
      Alert.alert('Access Denied', 'Partner role required');
      return null;
    }

    try {
      const response = await ApiService.getClientForTaskContext(clientId, taskId);

      if (response.success) {
        return response.data;
      } else {
        if (response.errorCode === 'UNAUTHORIZED') {
          Alert.alert(
            'Access Denied',
            'You do not have access to this client for the specified task.'
          );
        } else {
          Alert.alert('Error', response.error || 'Failed to load client information');
        }
        return null;
      }
    } catch (err) {
      console.error('Error loading client for task:', err);
      Alert.alert('Error', 'Network error: Unable to load client information');
      return null;
    }
  }, [hasAccess]);

  // Load clients on mount if user has access
  useEffect(() => {
    if (hasAccess) {
      loadClients();
    } else {
      setClients([]);
      setError('Access denied: Partner role required');
    }
  }, [hasAccess, loadClients]);

  return {
    clients,
    loading,
    error,
    refreshClients,
    getClientById,
    getClientForTask,
    hasAccess
  };
};

// Hook for checking partner access to specific client
export const usePartnerClientAccessCheck = (clientId: number) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const { user } = useAuth();

  const checkAccess = useCallback(async () => {
    if (!user || user.role !== 'partner') {
      setHasAccess(false);
      return;
    }

    try {
      setChecking(true);
      
      // Try to get client with minimal data to check access
      const response = await ApiService.getPartnerClientById(clientId);
      setHasAccess(response.success);
    } catch (err) {
      console.error('Error checking client access:', err);
      setHasAccess(false);
    } finally {
      setChecking(false);
    }
  }, [clientId, user]);

  useEffect(() => {
    if (clientId && user) {
      checkAccess();
    }
  }, [clientId, user, checkAccess]);

  return {
    hasAccess,
    checking,
    recheckAccess: checkAccess
  };
};

// Hook for partner access statistics (for monitoring)
export const usePartnerAccessStats = () => {
  const [stats, setStats] = useState({
    totalAccesses: 0,
    uniqueClientsAccessed: 0,
    lastAccessDate: null as Date | null
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadStats = useCallback(async () => {
    if (!user || user.role !== 'partner') {
      return;
    }

    try {
      setLoading(true);
      
      // This would be implemented when backend audit API is available
      // For now, we'll use client list length as a basic metric
      const response = await ApiService.getPartnerAccessibleClients();
      
      if (response.success) {
        setStats({
          totalAccesses: response.data.length,
          uniqueClientsAccessed: response.data.length,
          lastAccessDate: new Date()
        });
      }
    } catch (err) {
      console.error('Error loading access stats:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    refreshStats: loadStats
  };
};