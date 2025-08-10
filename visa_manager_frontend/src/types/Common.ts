// Common types used across the application

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'task' | 'payment' | 'urgent';
  read: boolean;
  createdAt: string;
  userId: string;
}

export interface DashboardStats {
  totalClients: number;
  total_clients?: number; // Legacy support
  pendingTasks: number;
  pending_tasks?: number; // Legacy support
  completedTasks: number;
  completed_tasks?: number; // Legacy support
  totalTasks?: number;
  total_tasks?: number; // Legacy support
  totalCommission: number;
  total_commission?: number; // Legacy support
  pendingCommission: number;
  paidCommission: number;
  totalEarned?: number;
  total_earned?: number; // Legacy support
  // Client statistics breakdown
  clientStats?: {
    pending: number;
    inProgress: number;
    underReview: number;
    completed: number;
    approved: number;
    rejected: number;
    documentsRequired: number;
  };
}

export interface Task {
  id: number;
  clientId: number;
  client_id?: number; // Legacy support
  clientName?: string;
  client_name?: string; // Legacy support
  assignedTo?: string;
  createdBy: string;
  taskType: string;
  task_type?: string; // Legacy support
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  commission: number;
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'agency' | 'partner';
  createdAt: string;
  updatedAt: string;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  role: 'partner';
  specialties?: string[];
  rating?: number;
  completedTasks?: number;
}

// API hook return type
export interface ApiHookResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Generic API call function type
export type ApiCallFunction<T> = (token: string) => Promise<T>;