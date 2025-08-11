// Client Management Model - TypeScript interfaces and types
// Following the established database schema from migration 003_create_clients_table.sql

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

// Main Client interface matching database schema
export interface Client {
  id:number
}

;
  name: string;
  email: string;
  phone?: string | undefined;
  visaType: VisaType;
  status: ClientStatus;
  notes?: string | undefined;
  agencyId: string; // Clerk user ID
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Clerk user ID
  updatedBy: string; // Clerk user ID
}

// Client creation request interface
export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  visaType: VisaType;
  status?: ClientStatus; // Optional, defaults to 'pending'
  notes?: string;
}

// Client update request interface (all fields optional except what's being updated)
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
  search?: string; // Search in name, email
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

// Paginated response interface
export interface PaginatedClientResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// Database row interface (matches exact database column names)
export interface ClientRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  visa_type: string;
  status: string;
  notes: string | null;
  agency_id: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
}

// Utility function to convert database row to Client interface
export function mapRowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || undefined,
    visaType: row.visa_type as VisaType,
    status: row.status as ClientStatus,
    notes: row.notes || undefined,
    agencyId: row.agency_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by
  };
}

// Validation schema for client data
export const clientValidationSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 255,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Name must be 2-255 characters and contain only letters, spaces, hyphens, and apostrophes'
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255,
    message: 'Please enter a valid email address'
  },
  phone: {
    required: false,
    pattern: /^\+?[\d\s\-\(\)]+$/,
    maxLength: 50,
    message: 'Please enter a valid phone number'
  },
  visaType: {
    required: true,
    enum: Object.values(VisaType),
    message: 'Please select a valid visa type'
  },
  status: {
    required: true,
    enum: Object.values(ClientStatus),
    message: 'Please select a valid status'
  },
  notes: {
    required: false,
    maxLength: 2000,
    message: 'Notes cannot exceed 2000 characters'
  }
};
