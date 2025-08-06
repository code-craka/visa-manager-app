// API Service for Client Management
// Following the established backend API patterns

import {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  ClientFilters,
  ClientStats,
  ApiResponse,
  ApiSuccessResponse,
  PaginationInfo
} from '../types/Client';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiService {
  private async getAuthToken(): Promise<string> {
    // This will be integrated with the existing AuthContext
    // For now, we'll return a placeholder that will be replaced when integrated
    const token = 'placeholder-token'; // TODO: Get from AuthContext
    return token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();

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
}

// Export singleton instance
export default new ApiService();
