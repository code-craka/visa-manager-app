/**
 * TaskError - Comprehensive error handling for task operations
 * Version: 0.3.2
 * 
 * Following the established patterns from ClientError with comprehensive
 * error handling, validation, and proper HTTP status codes
 */

import { TaskValidationError } from '../models/TaskValidation';

/**
 * Custom error class for task operations
 */
export class TaskError extends Error {
  public statusCode: number;
  public code: string;
  public field?: string | undefined;
  public details?: any;

  constructor(
    message: string, 
    statusCode: number = 500, 
    code: string = 'TASK_ERROR', 
    field?: string,
    details?: any
  ) {
    super(message);
    this.name = 'TaskError';
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    this.details = details;
  }
}

/**
 * Validation error class for task operations
 */
export class ValidationError extends TaskError {
  constructor(message: string, field: string, code: string = 'VALIDATION_ERROR') {
    super(message, 400, code, field);
    this.name = 'ValidationError';
  }
}

/**
 * Task error codes and messages
 */
export const TASK_ERRORS = {
  // General errors
  TASK_NOT_FOUND: {
    message: 'Task not found or access denied',
    statusCode: 404
  },
  ACCESS_DENIED: {
    message: 'Access denied to this task',
    statusCode: 403
  },
  INVALID_TASK_ID: {
    message: 'Invalid task ID provided',
    statusCode: 400
  },

  // Validation errors
  TITLE_REQUIRED: {
    message: 'Task title is required',
    statusCode: 400
  },
  TITLE_TOO_SHORT: {
    message: 'Task title must be at least 3 characters long',
    statusCode: 400
  },
  TITLE_TOO_LONG: {
    message: 'Task title must not exceed 255 characters',
    statusCode: 400
  },
  INVALID_CLIENT_ID: {
    message: 'Invalid client ID provided',
    statusCode: 400
  },
  INVALID_TASK_TYPE: {
    message: 'Invalid task type provided',
    statusCode: 400
  },
  INVALID_PRIORITY: {
    message: 'Invalid priority level provided',
    statusCode: 400
  },
  INVALID_STATUS: {
    message: 'Invalid task status provided',
    statusCode: 400
  },
  INVALID_PAYMENT_STATUS: {
    message: 'Invalid payment status provided',
    statusCode: 400
  },
  INVALID_COMMISSION_AMOUNT: {
    message: 'Commission amount must be a positive number',
    statusCode: 400
  },
  INVALID_COMMISSION_PERCENTAGE: {
    message: 'Commission percentage must be between 0 and 100',
    statusCode: 400
  },
  INVALID_DUE_DATE: {
    message: 'Invalid due date format',
    statusCode: 400
  },
  DESCRIPTION_TOO_LONG: {
    message: 'Task description must not exceed 2000 characters',
    statusCode: 400
  },
  NOTES_TOO_LONG: {
    message: 'Task notes must not exceed 2000 characters',
    statusCode: 400
  },

  // Assignment errors
  USER_NOT_FOUND: {
    message: 'Assigned user not found',
    statusCode: 404
  },
  INVALID_USER_ROLE: {
    message: 'User does not have the required role for this operation',
    statusCode: 400
  },
  TASK_ALREADY_ASSIGNED: {
    message: 'Task is already assigned to another user',
    statusCode: 409
  },
  CANNOT_ASSIGN_TO_SELF: {
    message: 'Cannot assign task to yourself',
    statusCode: 400
  },

  // Business logic errors
  TASK_DELETION_RESTRICTED: {
    message: 'Cannot delete completed and paid tasks',
    statusCode: 400
  },
  TASK_UPDATE_RESTRICTED: {
    message: 'Task cannot be updated in its current state',
    statusCode: 400
  },
  INVALID_STATUS_TRANSITION: {
    message: 'Invalid status transition',
    statusCode: 400
  },
  OVERDUE_TASK_RESTRICTION: {
    message: 'Cannot modify overdue tasks without proper authorization',
    statusCode: 400
  },

  // Database errors
  DATABASE_ERROR: {
    message: 'Database operation failed',
    statusCode: 500
  },
  FOREIGN_KEY_VIOLATION: {
    message: 'Referenced record does not exist',
    statusCode: 400
  },
  UNIQUE_VIOLATION: {
    message: 'Duplicate entry detected',
    statusCode: 409
  },
  CONNECTION_ERROR: {
    message: 'Database connection failed',
    statusCode: 500
  }
} as const;

/**
 * Validate task data and throw appropriate errors
 */
export function validateTaskData(data: any, operation: 'create' | 'update' | 'assign'): void {
  const errors: ValidationError[] = [];

  if (operation === 'create') {
    // Title validation
    if (!data.title || typeof data.title !== 'string') {
      errors.push(new ValidationError(TASK_ERRORS.TITLE_REQUIRED.message, 'title', 'TITLE_REQUIRED'));
    } else if (data.title.trim().length < 3) {
      errors.push(new ValidationError(TASK_ERRORS.TITLE_TOO_SHORT.message, 'title', 'TITLE_TOO_SHORT'));
    } else if (data.title.trim().length > 255) {
      errors.push(new ValidationError(TASK_ERRORS.TITLE_TOO_LONG.message, 'title', 'TITLE_TOO_LONG'));
    }

    // Client ID validation
    if (!data.client_id || typeof data.client_id !== 'number' || data.client_id <= 0) {
      errors.push(new ValidationError(TASK_ERRORS.INVALID_CLIENT_ID.message, 'client_id', 'INVALID_CLIENT_ID'));
    }

    // Task type validation
    if (!data.task_type || typeof data.task_type !== 'string') {
      errors.push(new ValidationError(TASK_ERRORS.INVALID_TASK_TYPE.message, 'task_type', 'INVALID_TASK_TYPE'));
    }
  }

  // Common validations for create and update
  if (operation === 'create' || operation === 'update') {
    // Description validation
    if (data.description && (typeof data.description !== 'string' || data.description.length > 2000)) {
      errors.push(new ValidationError(TASK_ERRORS.DESCRIPTION_TOO_LONG.message, 'description', 'DESCRIPTION_TOO_LONG'));
    }

    // Notes validation
    if (data.notes && (typeof data.notes !== 'string' || data.notes.length > 2000)) {
      errors.push(new ValidationError(TASK_ERRORS.NOTES_TOO_LONG.message, 'notes', 'NOTES_TOO_LONG'));
    }

    // Commission validations
    if (data.commission_amount !== undefined) {
      if (typeof data.commission_amount !== 'number' || data.commission_amount < 0) {
        errors.push(new ValidationError(TASK_ERRORS.INVALID_COMMISSION_AMOUNT.message, 'commission_amount', 'INVALID_COMMISSION_AMOUNT'));
      }
    }

    if (data.commission_percentage !== undefined) {
      if (typeof data.commission_percentage !== 'number' || data.commission_percentage < 0 || data.commission_percentage > 100) {
        errors.push(new ValidationError(TASK_ERRORS.INVALID_COMMISSION_PERCENTAGE.message, 'commission_percentage', 'INVALID_COMMISSION_PERCENTAGE'));
      }
    }
  }

  if (errors.length > 0) {
    throw errors[0]; // Throw the first validation error
  }
}

/**
 * Throw validation error with proper formatting
 */
export function throwValidationError(message: string, field: string, code: string): never {
  throw new ValidationError(message, field, code);
}

/**
 * Handle database errors and convert to appropriate TaskError
 */
export function handleDatabaseError(error: any): TaskError {
  console.error('Task Database Error:', error);

  // Handle specific PostgreSQL errors
  if (error.code === '23503') { // Foreign key violation
    if (error.constraint?.includes('client_id')) {
      return new TaskError(
        'The specified client does not exist or you do not have access to it',
        400,
        'INVALID_CLIENT_ID',
        'client_id'
      );
    }
    if (error.constraint?.includes('assigned_to')) {
      return new TaskError(
        'The specified user does not exist',
        400,
        'USER_NOT_FOUND',
        'assigned_to'
      );
    }
    return new TaskError(
      TASK_ERRORS.FOREIGN_KEY_VIOLATION.message,
      TASK_ERRORS.FOREIGN_KEY_VIOLATION.statusCode,
      'FOREIGN_KEY_VIOLATION'
    );
  }

  if (error.code === '23505') { // Unique violation
    return new TaskError(
      TASK_ERRORS.UNIQUE_VIOLATION.message,
      TASK_ERRORS.UNIQUE_VIOLATION.statusCode,
      'UNIQUE_VIOLATION'
    );
  }

  if (error.code === '42P01') { // Table does not exist
    return new TaskError(
      'Task system is not properly configured',
      500,
      'SYSTEM_ERROR'
    );
  }

  if (error.code === '42703') { // Column does not exist
    return new TaskError(
      'Task system configuration error',
      500,
      'SYSTEM_ERROR'
    );
  }

  // Handle connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return new TaskError(
      TASK_ERRORS.CONNECTION_ERROR.message,
      TASK_ERRORS.CONNECTION_ERROR.statusCode,
      'CONNECTION_ERROR'
    );
  }

  // Handle RLS policy violations
  if (error.message?.includes('policy') || error.message?.includes('permission denied')) {
    return new TaskError(
      TASK_ERRORS.ACCESS_DENIED.message,
      TASK_ERRORS.ACCESS_DENIED.statusCode,
      'ACCESS_DENIED'
    );
  }

  // Handle timeout errors
  if (error.message?.includes('timeout')) {
    return new TaskError(
      'Operation timed out. Please try again.',
      408,
      'TIMEOUT_ERROR'
    );
  }

  // Default error
  return new TaskError(
    TASK_ERRORS.DATABASE_ERROR.message,
    TASK_ERRORS.DATABASE_ERROR.statusCode,
    'DATABASE_ERROR',
    undefined,
    error.message
  );
}

/**
 * Format error response for API
 */
export function formatTaskErrorResponse(error: TaskError) {
  return {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      field: error.field,
      statusCode: error.statusCode,
      details: error.details
    }
  };
}

/**
 * Check if error is a task-related error
 */
export function isTaskError(error: any): error is TaskError {
  return error instanceof TaskError || error.name === 'TaskError';
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError || 
         error instanceof TaskValidationError ||
         error.name === 'ValidationError' ||
         error.name === 'TaskValidationError';
}