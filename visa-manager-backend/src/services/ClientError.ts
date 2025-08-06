// Custom Error Classes for Client Management
// Following the established error handling patterns from the copilot instructions

export class ClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode: string
  ) {
    super(message);
    this.name = 'ClientError';
  }
}

export class ClientValidationError extends ClientError {
  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    public validationErrors: ValidationError[]
  ) {
    super(message, statusCode, errorCode);
    this.name = 'ClientValidationError';
  }
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
}

// Standard client error codes
export const CLIENT_ERRORS = {
  NOT_FOUND: { code: 'CLIENT_NOT_FOUND', status: 404 },
  VALIDATION_FAILED: { code: 'VALIDATION_FAILED', status: 400 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 403 },
  DUPLICATE_EMAIL: { code: 'DUPLICATE_EMAIL', status: 409 },
  HAS_ACTIVE_TASKS: { code: 'HAS_ACTIVE_TASKS', status: 409 },
  CREATION_FAILED: { code: 'CREATION_FAILED', status: 500 },
  UPDATE_FAILED: { code: 'UPDATE_FAILED', status: 500 },
  DELETION_FAILED: { code: 'DELETION_FAILED', status: 500 },
  RETRIEVAL_FAILED: { code: 'RETRIEVAL_FAILED', status: 500 },
  STATS_FAILED: { code: 'STATS_FAILED', status: 500 }
};

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Validation function for client data
export function validateClientData(data: any): {
  isValid: boolean;
  errors: ValidationError[];
  validatedData?: any;
} {
  const errors: ValidationError[] = [];

  // Import validation schema
  const { clientValidationSchema } = require('../models/Client');

  // Validate each field according to schema
  Object.keys(clientValidationSchema).forEach(field => {
    const rule = clientValidationSchema[field];
    const value = data[field];

    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push({ field, message: `${field} is required` });
      return;
    }

    if (value && rule.pattern && !rule.pattern.test(value)) {
      errors.push({ field, message: rule.message });
    }

    if (value && rule.minLength && value.length < rule.minLength) {
      errors.push({ field, message: rule.message });
    }

    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors.push({ field, message: rule.message });
    }

    if (value && rule.enum && !rule.enum.includes(value)) {
      errors.push({ field, message: rule.message });
    }
  });

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Return sanitized data
  const validatedData = {
    name: data.name?.trim(),
    email: data.email?.trim().toLowerCase(),
    phone: data.phone?.trim() || undefined,
    visaType: data.visaType,
    status: data.status || 'pending',
    notes: data.notes?.trim() || undefined
  };

  return { isValid: true, errors: [], validatedData };
}

// Helper function to throw validation errors
export function throwValidationError(errors: ValidationError[]): never {
  throw new ClientValidationError(
    'Validation failed',
    CLIENT_ERRORS.VALIDATION_FAILED.status,
    CLIENT_ERRORS.VALIDATION_FAILED.code,
    errors
  );
}

// Helper function to handle database errors
export function handleDatabaseError(error: any, operation: string): never {
  console.error(`Database error during ${operation}:`, error);

  if (error.code === '23505') { // Unique constraint violation
    throw new ClientError(
      'Email already exists for this agency',
      CLIENT_ERRORS.DUPLICATE_EMAIL.status,
      CLIENT_ERRORS.DUPLICATE_EMAIL.code
    );
  }

  if (error.code === '23503') { // Foreign key constraint violation
    throw new ClientError(
      'Referenced record does not exist',
      CLIENT_ERRORS.VALIDATION_FAILED.status,
      CLIENT_ERRORS.VALIDATION_FAILED.code
    );
  }

  // Default error for unknown database issues
  const errorCode = operation === 'create' ? 'CREATION_FAILED' :
                   operation === 'update' ? 'UPDATE_FAILED' :
                   operation === 'delete' ? 'DELETION_FAILED' : 'RETRIEVAL_FAILED';

  throw new ClientError(
    `Failed to ${operation} client`,
    CLIENT_ERRORS[errorCode].status,
    CLIENT_ERRORS[errorCode].code
  );
}
