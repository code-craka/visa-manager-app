// API Service for Client Management
// Following the established backend API patterns
// Requirements: 1.3, 3.4, 3.5, 4.4

import {
  Client,
  RestrictedClient,
  CreateClientRequest,
  UpdateClientRequest,
  ClientFilters,
  ClientStats,
  ApiResponse,
  ApiSuccessResponse,
  PaginationInfo
} from '../types/Client';

import {
  Notification,
  DashboardStats,
  Task,
  Partner
} from '../types/Common';

import { clientCacheService } from './ClientCacheService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Enhanced error types for better error handling
export interface ApiError {
  type: 'NETWORK_ERROR' | 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'SERVER_ERROR' | 'TIMEOUT_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  statusCode?: number;
  errorCode?: string;
  details?: any;
  isRetryable: boolean;
}

// Request configuration interface
interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ApiService {
  private getAuthToken: (() => Promise<string | null>) | null = null;
  private defaultTimeout = 30000; // 30 seconds
  private defaultRetries = 3;
  private defaultRetryDelay = 1000; // 1 second
  private currentUserId: string | null = null;

  // Method to set the auth token getter from AuthContext
  setAuthTokenGetter(getter: () => Promise<string | null>) {
    this.getAuthToken = getter;
  }

  // Method to set current user ID for caching
  setCurrentUserId(userId: string) {
    this.currentUserId = userId;
  }

  private async getToken(): Promise<string> {
    if (!this.getAuthToken) {
      throw new Error('Auth token getter not initialized. Make sure to call setAuthTokenGetter.');
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    return token;
  }

  // Enhanced error handling
  private handleApiError(error: any, response?: Response): ApiError {
    // Network errors
    if (error.name === 'TypeError' && error.message === 'Network request failed') {
      return {
        type: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your internet connection.',
        isRetryable: true,
      };
    }

    // Timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return {
        type: 'TIMEOUT_ERROR',
        message: 'Request timed out. Please try again.',
        isRetryable: true,
      };
    }

    // HTTP response errors
    if (response) {
      const statusCode = response.status;

      if (statusCode === 401) {
        return {
          type: 'AUTH_ERROR',
          message: 'Your session has expired. Please log in again.',
          statusCode,
          isRetryable: false,
        };
      }

      if (statusCode === 403) {
        return {
          type: 'AUTH_ERROR',
          message: 'You do not have permission to perform this action.',
          statusCode,
          isRetryable: false,
        };
      }

      if (statusCode === 400) {
        return {
          type: 'VALIDATION_ERROR',
          message: 'Invalid request data. Please check your input.',
          statusCode,
          isRetryable: false,
        };
      }

      if (statusCode === 409) {
        return {
          type: 'VALIDATION_ERROR',
          message: 'Conflict: The resource already exists or has been modified.',
          statusCode,
          isRetryable: false,
        };
      }

      if (statusCode >= 500) {
        return {
          type: 'SERVER_ERROR',
          message: 'Server error occurred. Please try again later.',
          statusCode,
          isRetryable: true,
        };
      }

      if (statusCode === 404) {
        return {
          type: 'VALIDATION_ERROR',
          message: 'The requested resource was not found.',
          statusCode,
          isRetryable: false,
        };
      }
    }

    // Unknown errors
    return {
      type: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred.',
      isRetryable: false,
    };
  }

  // Enhanced request method with timeout, retries, and better error handling
  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      ...options
    } = config;

    let lastError: ApiError | null = null;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        const token = await this.getToken();

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle non-JSON responses
        let data: any;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch (jsonError) {
            throw new Error('Invalid JSON response from server');
          }
        } else {
          // For non-JSON responses (like DELETE operations)
          data = { success: response.ok };
        }

        // Handle HTTP error status codes
        if (!response.ok) {
          const apiError = this.handleApiError(new Error(`HTTP ${response.status}`), response);

          // Include server error details if available
          if (data && data.error) {
            apiError.message = data.error;
            apiError.errorCode = data.errorCode;
            apiError.details = data.details;
          }

          // Don't retry non-retryable errors
          if (!apiError.isRetryable) {
            return {
              success: false,
              error: apiError.message,
              errorCode: apiError.errorCode || apiError.type,
              statusCode: apiError.statusCode,
            };
          }

          lastError = apiError;
          throw new Error(apiError.message);
        }

        // Return successful response
        return data;

      } catch (error: any) {
        const apiError = this.handleApiError(error);
        lastError = apiError;

        // Don't retry non-retryable errors
        if (!apiError.isRetryable || attempt >= retries) {
          break;
        }

        // Wait before retrying
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }

        attempt++;
      }
    }

    // Return final error
    return {
      success: false,
      error: lastError?.message || 'Request failed after multiple attempts',
      errorCode: lastError?.errorCode || lastError?.type || 'UNKNOWN_ERROR',
      statusCode: lastError?.statusCode,
    };
  }

  // Validate email uniqueness
  async validateEmailUniqueness(email: string, excludeId?: number): Promise<ApiResponse<{ isUnique: boolean }>> {
    const queryParams = new URLSearchParams();
    queryParams.append('email', email.toLowerCase());
    if (excludeId) {
      queryParams.append('excludeId', excludeId.toString());
    }

    return this.makeRequest<{ isUnique: boolean }>(`/clients/validate-email?${queryParams.toString()}`, {
      timeout: 10000, // Shorter timeout for validation
      retries: 1, // Fewer retries for validation
    });
  }

  // Get all clients with filtering, searching, sorting, and pagination
  async getClients(filters?: ClientFilters): Promise<ApiResponse<Client[]> & { pagination?: PaginationInfo }> {
    // Check cache first if user ID is available
    if (this.currentUserId && filters) {
      const cachedClients = clientCacheService.getCachedClientList(filters, this.currentUserId);
      if (cachedClients) {
        return {
          success: true,
          data: cachedClients,
          message: 'Data loaded from cache'
        };
      }
    }

    const queryParams = new URLSearchParams();

    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.visaType) queryParams.append('visaType', filters.visaType);
    if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const endpoint = `/clients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await this.makeRequest<Client[]>(endpoint);

    if (response.success && this.currentUserId && filters) {
      // Cache the response
      clientCacheService.cacheClientList(response.data, filters, this.currentUserId);

      return {
        ...response,
        pagination: (response as ApiSuccessResponse<Client[]>).pagination
      };
    }

    return response;
  }

  // Get specific client by ID
  async getClientById(id: number): Promise<ApiResponse<Client>> {
    // Check cache first
    const cachedClient = clientCacheService.getCachedClient(id);
    if (cachedClient) {
      return {
        success: true,
        data: cachedClient,
        message: 'Data loaded from cache'
      };
    }

    const response = await this.makeRequest<Client>(`/clients/${id}`);

    if (response.success) {
      // Cache the response
      clientCacheService.cacheClient(response.data);
    }

    return response;
  }

  // Create new client
  async createClient(clientData: CreateClientRequest): Promise<ApiResponse<Client>> {
    const response = await this.makeRequest<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });

    if (response.success && this.currentUserId) {
      // Cache the new client
      clientCacheService.cacheClient(response.data);
      // Invalidate client lists to force refresh
      clientCacheService.invalidateOnClientCreate(this.currentUserId);
    }

    return response;
  }

  // Update existing client
  async updateClient(id: number, updates: UpdateClientRequest): Promise<ApiResponse<Client>> {
    const response = await this.makeRequest<Client>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (response.success) {
      // Update cache with new client data
      clientCacheService.updateCachedClient(response.data);
    }

    return response;
  }

  // Delete client
  async deleteClient(id: number): Promise<ApiResponse<void>> {
    const response = await this.makeRequest<void>(`/clients/${id}`, {
      method: 'DELETE',
    });

    if (response.success && this.currentUserId) {
      // Invalidate cache for deleted client
      clientCacheService.invalidateOnClientDelete(id, this.currentUserId);
    }

    return response;
  }

  // Get client statistics for dashboard
  async getClientStats(): Promise<ApiResponse<ClientStats>> {
    // Check cache first if user ID is available
    if (this.currentUserId) {
      const cachedStats = clientCacheService.getCachedClientStats(this.currentUserId);
      if (cachedStats) {
        return {
          success: true,
          data: cachedStats,
          message: 'Data loaded from cache'
        };
      }
    }

    const response = await this.makeRequest<ClientStats>('/clients/stats');

    if (response.success && this.currentUserId) {
      // Cache the response
      clientCacheService.cacheClientStats(response.data, this.currentUserId);
    }

    return response;
  }

  // Get clients for task assignment (simplified view)
  async getClientsForAssignment(excludeIds?: number[]): Promise<ApiResponse<Partial<Client>[]>> {
    const queryParams = new URLSearchParams();
    if (excludeIds && excludeIds.length > 0) {
      queryParams.append('exclude', excludeIds.join(','));
    }

    const endpoint = `/clients/for-assignment${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<Partial<Client>[]>(endpoint);
  }

  // Partner-specific client methods

  // Get clients accessible to partner (restricted view)
  async getPartnerAccessibleClients(): Promise<ApiResponse<RestrictedClient[]>> {
    return this.makeRequest<RestrictedClient[]>('/clients/partner-accessible');
  }

  // Get specific client by ID for partner (restricted view)
  async getPartnerClientById(id: number, taskId?: number): Promise<ApiResponse<RestrictedClient>> {
    const queryParams = new URLSearchParams();
    if (taskId) {
      queryParams.append('taskId', taskId.toString());
    }

    const endpoint = `/clients/${id}/partner-view${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<RestrictedClient>(endpoint);
  }

  // Get client for task context (minimal data for partners)
  async getClientForTaskContext(id: number, taskId: number): Promise<ApiResponse<Partial<RestrictedClient>>> {
    const queryParams = new URLSearchParams();
    queryParams.append('taskId', taskId.toString());

    const endpoint = `/clients/${id}/task-context?${queryParams.toString()}`;
    return this.makeRequest<Partial<RestrictedClient>>(endpoint);
  }

  // Dashboard-related methods
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get client statistics
      const clientStatsResponse = await this.getClientStats();

      if (clientStatsResponse.success) {
        const clientStats = clientStatsResponse.data;

        // Transform client stats to dashboard stats format
        return {
          totalClients: clientStats.totalClients,
          total_clients: clientStats.totalClients, // Legacy support
          pendingTasks: clientStats.pending + clientStats.inProgress + clientStats.underReview,
          completedTasks: clientStats.completed + clientStats.approved,
          totalCommission: 0, // TODO: Implement commission calculation
          pendingCommission: 0, // TODO: Implement commission calculation
          paidCommission: 0, // TODO: Implement commission calculation
          // Add client status breakdown
          clientStats: {
            pending: clientStats.pending,
            inProgress: clientStats.inProgress,
            underReview: clientStats.underReview,
            completed: clientStats.completed,
            approved: clientStats.approved,
            rejected: clientStats.rejected,
            documentsRequired: clientStats.documentsRequired
          }
        };
      } else {
        // Return default stats if API call fails
        return {
          totalClients: 0,
          pendingTasks: 0,
          completedTasks: 0,
          totalCommission: 0,
          pendingCommission: 0,
          paidCommission: 0
        };
      }
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return {
        totalClients: 0,
        pendingTasks: 0,
        completedTasks: 0,
        totalCommission: 0,
        pendingCommission: 0,
        paidCommission: 0
      };
    }
  }

  // Task-related methods
  async getTasks(filters: { page: number; limit: number }): Promise<Task[]> {
    // Mock implementation - replace with actual API call
    console.log('Getting tasks with filters:', filters);
    return [];
  }

  // Get specific task by ID
  async getTaskById(id: number): Promise<ApiResponse<Task>> {
    // Mock implementation - replace with actual API call
    console.log('Getting task by ID:', id);
    return {
      success: false,
      error: 'Not implemented',
      errorCode: 'NOT_IMPLEMENTED'
    };
  }

  // Create new task
  async createTask(taskData: any): Promise<ApiResponse<Task>> {
    // Mock implementation - replace with actual API call
    console.log('Creating task:', taskData);
    return {
      success: false,
      error: 'Not implemented',
      errorCode: 'NOT_IMPLEMENTED'
    };
  }

  // Assign task to partner
  async assignTask(assignmentData: any): Promise<ApiResponse<Task>> {
    // Mock implementation - replace with actual API call
    console.log('Assigning task:', assignmentData);
    return {
      success: false,
      error: 'Not implemented',
      errorCode: 'NOT_IMPLEMENTED'
    };
  }

  // Notification-related methods
  async getNotifications(page: number, limit: number, unreadOnly: boolean): Promise<Notification[]> {
    // Mock implementation - replace with actual API call
    console.log('Getting notifications:', { page, limit, unreadOnly });
    return [];
  }

  // User-related methods
  async getPartners(): Promise<Partner[]> {
    // Mock implementation - replace with actual API call
    return [];
  }

  // Get all users with optional role filter
  async getUsers(filters?: { role?: string }): Promise<ApiResponse<any[]>> {
    // Mock implementation - replace with actual API call
    console.log('Getting users with filters:', filters);
    return {
      success: false,
      error: 'Not implemented',
      errorCode: 'NOT_IMPLEMENTED'
    };
  }
}

// Export singleton instance
export default new ApiService();

// Re-export types for convenience
export type {
  Client,
  RestrictedClient,
  CreateClientRequest,
  UpdateClientRequest,
  ClientFilters,
  ClientStats,
  ApiResponse,
  ApiSuccessResponse,
  PaginationInfo
} from '../types/Client';

// Re-export common types
export type {
  Notification,
  DashboardStats,
  Task,
  User,
  Partner
} from '../types/Common';

// Export the hook
export { useApiService } from '../hooks/useApiService';
