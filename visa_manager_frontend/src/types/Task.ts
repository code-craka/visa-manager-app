/**
 * Task Types - Frontend TypeScript interfaces matching backend Task model
 * Version: 0.3.2
 * 
 * Comprehensive task management types for React Native frontend
 * Matches visa-manager-backend/src/models/Task.ts
 */

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid';
export type TaskType = 
  | 'fingerprint' 
  | 'medical_exam' 
  | 'document_review' 
  | 'interview' 
  | 'translation' 
  | 'notarization' 
  | 'background_check' 
  | 'photo_service';

/**
 * Core Task interface representing a task from the API
 */
export interface Task {
  id: number;
  title: string;
  description?: string;
  client_id: number;
  assigned_to?: string; // Clerk user ID
  created_by: string; // Clerk user ID
  priority: TaskPriority;
  status: TaskStatus;
  task_type: TaskType;
  commission_amount: number;
  commission_percentage: number;
  payment_status: PaymentStatus;
  due_date?: string; // ISO string
  assigned_date?: string; // ISO string
  completed_date?: string; // ISO string
  notes?: string;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

/**
 * Task creation interface for API requests
 */
export interface CreateTaskRequest {
  title: string;
  description?: string;
  client_id: number;
  assigned_to?: string;
  priority?: TaskPriority;
  task_type: TaskType;
  commission_amount?: number;
  commission_percentage?: number;
  due_date?: string; // ISO string format
  notes?: string;
}

/**
 * Task update interface for API requests
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assigned_to?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  commission_amount?: number;
  commission_percentage?: number;
  payment_status?: PaymentStatus;
  due_date?: string; // ISO string format
  notes?: string;
  completed_date?: string; // ISO string format
}

/**
 * Task assignment interface for API requests
 */
export interface AssignTaskRequest {
  assigned_to: string; // Clerk user ID of partner
  notes?: string;
}

/**
 * Task with related data from API responses
 */
export interface TaskWithDetails extends Task {
  client?: {
    id: number;
    name: string;
    email: string;
    visa_type: string;
    status: string;
  };
  assigned_user?: {
    clerk_user_id: string;
    name: string;
    email: string;
    role: string;
  };
  created_user?: {
    clerk_user_id: string;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Task statistics interface for dashboard
 */
export interface TaskStatistics {
  total_tasks: number;
  pending_tasks: number;
  assigned_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  cancelled_tasks: number;
  urgent_tasks: number;
  high_priority_tasks: number;
  overdue_tasks: number;
  total_commission_earned: number;
  total_commission_pending: number;
  completion_rate: number; // percentage
  average_completion_time: number; // in days
}

/**
 * Task filter options for API queries
 */
export interface TaskFilters {
  client_id?: number;
  assigned_to?: string;
  created_by?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  task_type?: TaskType;
  payment_status?: PaymentStatus;
  due_date_from?: string;
  due_date_to?: string;
  created_from?: string;
  created_to?: string;
  search?: string; // Search in title, description, notes
}

/**
 * Pagination options for task queries
 */
export interface TaskPaginationOptions {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'status' | 'title';
  sort_order?: 'asc' | 'desc';
}

/**
 * Task query response with pagination from API
 */
export interface TaskQueryResponse {
  tasks: TaskWithDetails[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
  };
  statistics?: TaskStatistics;
}

/**
 * API Response wrapper for task operations
 */
export interface TaskApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  message?: string;
}

/**
 * Task priority configuration with display properties for React Native
 */
export const TASK_PRIORITY_CONFIG = {
  urgent: {
    label: 'Urgent',
    color: '#f44336', // Red
    weight: 4,
    icon: 'alert-circle'
  },
  high: {
    label: 'High',
    color: '#ff9800', // Orange
    weight: 3,
    icon: 'arrow-up-circle'
  },
  medium: {
    label: 'Medium',
    color: '#2196f3', // Blue
    weight: 2,
    icon: 'minus-circle'
  },
  low: {
    label: 'Low',
    color: '#9e9e9e', // Gray
    weight: 1,
    icon: 'arrow-down-circle'
  }
} as const;

/**
 * Task status configuration with display properties for React Native
 */
export const TASK_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#9e9e9e', // Gray
    icon: 'clock-outline'
  },
  assigned: {
    label: 'Assigned',
    color: '#2196f3', // Blue
    icon: 'account-check'
  },
  in_progress: {
    label: 'In Progress',
    color: '#ff9800', // Orange
    icon: 'progress-clock'
  },
  completed: {
    label: 'Completed',
    color: '#4caf50', // Green
    icon: 'check-circle'
  },
  cancelled: {
    label: 'Cancelled',
    color: '#f44336', // Red
    icon: 'cancel'
  }
} as const;

/**
 * Task type configuration with display properties for React Native
 */
export const TASK_TYPE_CONFIG = {
  fingerprint: {
    label: 'Fingerprinting',
    icon: 'fingerprint',
    color: '#673ab7'
  },
  medical_exam: {
    label: 'Medical Exam',
    icon: 'medical-bag',
    color: '#e91e63'
  },
  document_review: {
    label: 'Document Review',
    icon: 'file-document',
    color: '#3f51b5'
  },
  interview: {
    label: 'Interview',
    icon: 'account-voice',
    color: '#009688'
  },
  translation: {
    label: 'Translation',
    icon: 'translate',
    color: '#795548'
  },
  notarization: {
    label: 'Notarization',
    icon: 'certificate',
    color: '#607d8b'
  },
  background_check: {
    label: 'Background Check',
    icon: 'shield-search',
    color: '#ff5722'
  },
  photo_service: {
    label: 'Photo Service',
    icon: 'camera',
    color: '#ffc107'
  }
} as const;

/**
 * Payment status configuration for React Native
 */
export const PAYMENT_STATUS_CONFIG = {
  unpaid: {
    label: 'Unpaid',
    color: '#f44336', // Red
    icon: 'currency-usd-off'
  },
  pending: {
    label: 'Pending',
    color: '#ff9800', // Orange
    icon: 'clock-outline'
  },
  paid: {
    label: 'Paid',
    color: '#4caf50', // Green
    icon: 'check-circle'
  }
} as const;

/**
 * Helper function to get priority weight for sorting
 */
export const getPriorityWeight = (priority: TaskPriority): number => {
  return TASK_PRIORITY_CONFIG[priority].weight;
};

/**
 * Helper function to get priority color
 */
export const getPriorityColor = (priority: TaskPriority): string => {
  return TASK_PRIORITY_CONFIG[priority].color;
};

/**
 * Helper function to get status color
 */
export const getStatusColor = (status: TaskStatus): string => {
  return TASK_STATUS_CONFIG[status].color;
};

/**
 * Helper function to get task type color
 */
export const getTaskTypeColor = (taskType: TaskType): string => {
  return TASK_TYPE_CONFIG[taskType].color;
};

/**
 * Helper function to get payment status color
 */
export const getPaymentStatusColor = (paymentStatus: PaymentStatus): string => {
  return PAYMENT_STATUS_CONFIG[paymentStatus].color;
};

/**
 * Helper function to check if task is overdue
 */
export const isTaskOverdue = (task: Task): boolean => {
  if (!task.due_date) return false;
  const dueDate = new Date(task.due_date);
  const now = new Date();
  return dueDate < now && task.status !== 'completed' && task.status !== 'cancelled';
};

/**
 * Helper function to calculate days until due
 */
export const getDaysUntilDue = (task: Task): number | null => {
  if (!task.due_date) return null;
  const dueDate = new Date(task.due_date);
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Helper function to format commission display
 */
export const formatCommission = (task: Task): string => {
  const parts: string[] = [];
  
  if (task.commission_amount > 0) {
    parts.push(`$${task.commission_amount.toFixed(2)}`);
  }
  
  if (task.commission_percentage > 0) {
    parts.push(`${task.commission_percentage}%`);
  }
  
  return parts.join(' + ') || 'No commission';
};