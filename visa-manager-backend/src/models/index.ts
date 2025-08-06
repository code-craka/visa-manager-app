// Central export file for all models
// This makes imports cleaner throughout the application

// Client model exports
export {
  // Types and interfaces
  Client,
  VisaType,
  ClientStatus,
  CreateClientRequest,
  UpdateClientRequest,
  ClientFilters,
  ClientStats,
  PaginatedClientResponse,
  
  // Functions
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientStats,
  getClientsForTaskAssignment,
  
  // Validation exports
  validateCreateClientRequest,
  validateUpdateClientRequest,
  sanitizeClientData,
  ValidationResult
} from './Client.js';

// Validation utilities
export {
  clientValidationRules,
  validateCreateClientRequest as validateCreateClient,
  validateUpdateClientRequest as validateUpdateClient,
  sanitizeClientData as sanitizeClient
} from './ClientValidation.js';

// Re-export existing models for backward compatibility
export * from './User.js';
export * from './Task.js';
export * from './Notification.js';