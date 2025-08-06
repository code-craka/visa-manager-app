import { useAuth } from '../context/AuthContext';

// Backend API base URL - use 10.0.2.2 for Android emulator or your computer's IP for physical device
const API_BASE_URL = 'http://10.0.2.2:3000/api';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Client {
  id: number;
  name: string;
  passport: string;
  visa_type: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  client_id: number;
  assigned_to: number | null;
  created_by: number;
  task_type: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  commission: number;
  payment_status: 'unpaid' | 'paid' | 'partial';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Additional fields from joins
  client_name?: string;
  partner_name?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'task' | 'payment' | 'urgent';
  read: boolean;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'agency' | 'partner';
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_clients?: number;
  total_tasks?: number;
  pending_tasks?: number;
  completed_tasks?: number;
  total_commission?: number;
  pending_payment?: number;
  total_earned?: number;
}

class ApiService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    // We'll get the token from the auth context
    const token = await this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async getToken(): Promise<string | null> {
    // This will be called from components that have access to useAuth
    // For now, we'll return null and handle it in the component level
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth endpoints
  async syncUser(role: 'agency' | 'partner', token: string) {
    return this.request('/auth/sync-user', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }, token);
  }

  async getProfile(token: string) {
    return this.request('/auth/profile', {
      method: 'GET',
    }, token);
  }

  // User endpoints
  async getUsers(token: string, filters?: {
    role?: 'agency' | 'partner';
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';

    return this.request(endpoint, {
      method: 'GET',
    }, token);
  }

  // Client endpoints
  async getClients(token: string, page: number = 1, limit: number = 20): Promise<{ clients: Client[]; total: number; page: number; totalPages: number }> {
    return this.request(`/clients?page=${page}&limit=${limit}`, {
      method: 'GET',
    }, token);
  }

  async getClient(id: number, token: string): Promise<Client> {
    return this.request(`/clients/${id}`, {
      method: 'GET',
    }, token);
  }

  async createClient(clientData: Omit<Client, 'id' | 'created_by' | 'created_at' | 'updated_at'>, token: string): Promise<Client> {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    }, token);
  }

  async updateClient(id: number, clientData: Partial<Client>, token: string): Promise<Client> {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    }, token);
  }

  async deleteClient(id: number, token: string): Promise<void> {
    return this.request(`/clients/${id}`, {
      method: 'DELETE',
    }, token);
  }

  // Task endpoints
  async getTasks(token: string, filters?: {
    assignedTo?: number;
    createdBy?: number;
    status?: string;
    clientId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ tasks: Task[]; total: number; page: number; totalPages: number }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';

    return this.request(endpoint, {
      method: 'GET',
    }, token);
  }

  async getTask(id: number, token: string): Promise<Task> {
    return this.request(`/tasks/${id}`, {
      method: 'GET',
    }, token);
  }

  async createTask(taskData: {
    client_id: number;
    assigned_to: number | null;
    task_type: string;
    description?: string;
    commission: number;
    due_date?: string;
  }, token: string): Promise<Task> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }, token);
  }

  async updateTask(id: number, taskData: Partial<Task>, token: string): Promise<Task> {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    }, token);
  }

  async completeTask(id: number, completionNotes?: string, token?: string): Promise<Task> {
    return this.request(`/tasks/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ completion_notes: completionNotes }),
    }, token);
  }

  async deleteTask(id: number, token: string): Promise<void> {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    }, token);
  }

  async assignTask(token: string, assignmentData: {
    task_id: number;
    assigned_to: number;
    notes?: string;
  }): Promise<Task> {
    return this.request(`/tasks/${assignmentData.task_id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({
        assigned_to: assignmentData.assigned_to,
        notes: assignmentData.notes,
      }),
    }, token);
  }

  // Notification endpoints
  async getNotifications(token: string, page: number = 1, limit: number = 20, unreadOnly: boolean = false): Promise<{ notifications: Notification[]; total: number; page: number; totalPages: number }> {
    return this.request(`/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`, {
      method: 'GET',
    }, token);
  }

  async markNotificationAsRead(id: number, token: string): Promise<Notification> {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    }, token);
  }

  async markAllNotificationsAsRead(token: string): Promise<{ count: number }> {
    return this.request('/notifications/mark-all-read', {
      method: 'PATCH',
    }, token);
  }

  async getUnreadNotificationCount(token: string): Promise<{ count: number }> {
    return this.request('/notifications/unread-count', {
      method: 'GET',
    }, token);
  }

  // Dashboard endpoints
  async getDashboardStats(token: string): Promise<DashboardStats> {
    return this.request('/dashboard/stats', {
      method: 'GET',
    }, token);
  }

  async getCommissionReport(partnerId?: number, token?: string): Promise<{
    summary: any;
    monthly_breakdown: any[];
  }> {
    const endpoint = partnerId
      ? `/tasks/partner/${partnerId}/commission-report`
      : '/dashboard/commission-report';

    return this.request(endpoint, {
      method: 'GET',
    }, token);
  }
}

export const apiService = new ApiService();

// Custom hook to use API service with authentication
export const useApiService = () => {
  const { getAuthToken } = useAuth();

  const callApi = async <T>(
    apiCall: (token: string) => Promise<T>
  ): Promise<T> => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return apiCall(token);
  };

  return {
    callApi,
    apiService,
  };
};
