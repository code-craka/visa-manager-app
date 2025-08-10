// API Service for Client Management
// Following the established backend API patterns

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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiService {
  private getAuthToken: (() => Promise<string | null>) | null = null;

  // Method to set the auth token getter from AuthContext
  setAuthTokenGetter(getter: () => Promise<string | null>) {
    this.getAuthToken = getter;
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

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getToken();

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      return {
        success: false,
        error: 'Network error occurred',
        errorCode: 'NETWORK_ERROR'
      };
    }
  }

  // Get all clients with filtering, searching, sorting, and pagination
  async getClients(filters?: ClientFilters): Promise<ApiResponse<Client[]> & { pagination?: PaginationInfo }> {
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

    if (response.success) {
      return {
        ...response,
        pagination: (response as ApiSuccessResponse<Client[]>).pagination
      };
    }

    return response;
  }

  // Get specific client by ID
  async getClientById(id: number): Promise<ApiResponse<Client>> {
    return this.makeRequest<Client>(`/clients/${id}`);
  }

  // Create new client
  async createClient(clientData: CreateClientRequest): Promise<ApiResponse<Client>> {
    return this.makeRequest<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  // Update existing client
  async updateClient(id: number, updates: UpdateClientRequest): Promise<ApiResponse<Client>> {
    return this.makeRequest<Client>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Delete client
  async deleteClient(id: number): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // Get client statistics for dashboard
  async getClientStats(): Promise<ApiResponse<ClientStats>> {
    return this.makeRequest<ClientStats>('/clients/stats');
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
    // Mock implementation - replace with actual API call
    return {
      totalClients: 0,
      pendingTasks: 0,
      completedTasks: 0,
      totalCommission: 0,
      pendingCommission: 0,
      paidCommission: 0
    };
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
