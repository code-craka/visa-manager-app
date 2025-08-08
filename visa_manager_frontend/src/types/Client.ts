// Client-related TypeScript types for the frontend
// Following the backend model structure for consistency

export enum VisaType {
  TOURIST = 'tourist',
  BUSINESS = 'business',
  STUDENT = 'student',
  WORK = 'work',
  FAMILY = 'family',
  TRANSIT = 'transit'
}

export enum ClientStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DOCUMENTS_REQUIRED = 'documents_required',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed'
}

// Main Client interface matching backend
export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  visaType: VisaType;
  visa_type?: string; // Legacy support
  status: ClientStatus;
  notes?: string;
  agencyId: string;
  passport?: string; // Legacy field for display
  createdAt: string; // ISO string from API
  updatedAt: string; // ISO string from API
  createdBy: string;
  updatedBy: string;
}

// Client creation request interface
export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  visaType: VisaType;
  status?: ClientStatus;
  notes?: string;
}

// Client update request interface
export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  visaType?: VisaType;
  status?: ClientStatus;
  notes?: string;
}

// Client filtering and query options
export interface ClientFilters {
  search?: string;
  status?: ClientStatus;
  visaType?: VisaType;
  sortBy?: 'name' | 'date' | 'visaType';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Client statistics for dashboard
export interface ClientStats {
  totalClients: number;
  pending: number;
  inProgress: number;
  underReview: number;
  completed: number;
  approved: number;
  rejected: number;
  documentsRequired: number;
}

// API response interfaces
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  details?: ValidationError[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Helper type for API responses
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
