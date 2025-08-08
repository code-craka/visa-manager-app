// Custom hook for API service integration
// This provides a consistent interface for API calls with authentication

import { useState, useCallback } from 'react';
import { ApiCallFunction, ApiHookResult } from '../types/Common';
import ApiService from '../services/ApiService';

export function useApiService() {
  // Mock token for now - will be replaced with actual Clerk integration
  const getToken = useCallback(async () => {
    return 'mock-token-for-development';
  }, []);

  const callApi = useCallback(async <T>(apiCall: ApiCallFunction<T>): Promise<T | null> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      return await apiCall(token);
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, [getToken]);

  return { callApi, apiService: ApiService };
}

// Generic hook for API data fetching with loading states
export function useApiData<T>(
  apiCall: ApiCallFunction<T>,
  dependencies: any[] = []
): ApiHookResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { callApi } = useApiService();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await callApi(apiCall);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [callApi, apiCall]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}