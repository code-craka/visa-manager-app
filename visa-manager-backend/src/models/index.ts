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

// Re-export existing models for backward compatibility
export * from './User.js';
export * from './Task.js';
export * from './Notification.js';