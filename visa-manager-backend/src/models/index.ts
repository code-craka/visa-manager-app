// Central export file for all models
// This makes imports cleaner throughout the application

// Client model exports - Types and interfaces
export type {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  ClientFilters,
  ClientStats,
  PaginatedClientResponse,
  ClientRow
} from './Client.js';

// Client model exports - Enums and functions
export {
  VisaType,
  ClientStatus,
  mapRowToClient,
  clientValidationSchema
} from './Client.js';

// Validation utilities
export type {
  ValidationResult
} from './ClientValidation.js';

export {
  clientValidationRules,
  validateCreateClientRequest,
  validateUpdateClientRequest,
  sanitizeClientData
} from './ClientValidation.js';

// Task model exports - Types and interfaces
export type {
  Task,
  TaskWithDetails,
  CreateTaskRequest,
  UpdateTaskRequest,
  AssignTaskRequest,
  TaskFilters,
  TaskStatistics,
  TaskPaginationOptions,
  TaskQueryResponse,
  TaskPriority,
  TaskStatus,
  TaskType,
  PaymentStatus
} from './Task.js';

// Task model exports - Constants and configurations
export {
  TASK_PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  TASK_TYPE_CONFIG,
  PAYMENT_STATUS_CONFIG
} from './Task.js';

// Task validation exports
export {
  TaskValidation,
  TaskValidationError
} from './TaskValidation.js';

// Re-export existing models for backward compatibility
export * from './User.js';
export * from './Notification.js';