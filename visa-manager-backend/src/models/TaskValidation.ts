/**
 * Task Validation Schema
 * Version: 0.3.2
 * 
 * Comprehensive validation for task management operations
 * Following the established patterns from ClientValidation
 */

import { 
  TaskPriority, 
  TaskStatus, 
  TaskType, 
  PaymentStatus,
  CreateTaskRequest,
  UpdateTaskRequest,
  AssignTaskRequest,
  TaskFilters,
  TaskPaginationOptions
} from './Task';

/**
 * Validation error class for task operations
 */
export class TaskValidationError extends Error {
  public field: string;
  public code: string;

  constructor(message: string, field: string, code: string) {
    super(message);
    this.name = 'TaskValidationError';
    this.field = field;
    this.code = code;
  }
}

/**
 * Task validation utility class
 */
export class TaskValidation {
  
  /**
   * Validate task creation request
   */
  static validateCreateTask(data: CreateTaskRequest): void {
    const errors: TaskValidationError[] = [];

    // Title validation
    if (!data.title || typeof data.title !== 'string') {
      errors.push(new TaskValidationError('Title is required', 'title', 'REQUIRED'));
    } else if (data.title.trim().length < 3) {
      errors.push(new TaskValidationError('Title must be at least 3 characters long', 'title', 'MIN_LENGTH'));
    } else if (data.title.trim().length > 255) {
      errors.push(new TaskValidationError('Title must not exceed 255 characters', 'title', 'MAX_LENGTH'));
    }

    // Client ID validation
    if (!data.client_id || typeof data.client_id !== 'number') {
      errors.push(new TaskValidationError('Client ID is required', 'client_id', 'REQUIRED'));
    } else if (data.client_id <= 0) {
      errors.push(new TaskValidationError('Client ID must be a positive number', 'client_id', 'INVALID'));
    }

    // Task type validation
    if (!data.task_type || typeof data.task_type !== 'string') {
      errors.push(new TaskValidationError('Task type is required', 'task_type', 'REQUIRED'));
    } else if (!this.isValidTaskType(data.task_type)) {
      errors.push(new TaskValidationError(
        'Invalid task type. Must be one of: fingerprint, medical_exam, document_review, interview, translation, notarization, background_check, photo_service',
        'task_type',
        'INVALID'
      ));
    }

    // Optional field validations
    if (data.description && typeof data.description !== 'string') {
      errors.push(new TaskValidationError('Description must be a string', 'description', 'INVALID_TYPE'));
    } else if (data.description && data.description.length > 2000) {
      errors.push(new TaskValidationError('Description must not exceed 2000 characters', 'description', 'MAX_LENGTH'));
    }

    if (data.assigned_to && typeof data.assigned_to !== 'string') {
      errors.push(new TaskValidationError('Assigned to must be a string', 'assigned_to', 'INVALID_TYPE'));
    } else if (data.assigned_to && data.assigned_to.trim().length === 0) {
      errors.push(new TaskValidationError('Assigned to cannot be empty', 'assigned_to', 'EMPTY'));
    }

    if (data.priority && !this.isValidPriority(data.priority)) {
      errors.push(new TaskValidationError(
        'Invalid priority. Must be one of: urgent, high, medium, low',
        'priority',
        'INVALID'
      ));
    }

    if (data.commission_amount !== undefined) {
      if (typeof data.commission_amount !== 'number') {
        errors.push(new TaskValidationError('Commission amount must be a number', 'commission_amount', 'INVALID_TYPE'));
      } else if (data.commission_amount < 0) {
        errors.push(new TaskValidationError('Commission amount cannot be negative', 'commission_amount', 'INVALID'));
      } else if (data.commission_amount > 999999.99) {
        errors.push(new TaskValidationError('Commission amount cannot exceed 999,999.99', 'commission_amount', 'MAX_VALUE'));
      }
    }

    if (data.commission_percentage !== undefined) {
      if (typeof data.commission_percentage !== 'number') {
        errors.push(new TaskValidationError('Commission percentage must be a number', 'commission_percentage', 'INVALID_TYPE'));
      } else if (data.commission_percentage < 0) {
        errors.push(new TaskValidationError('Commission percentage cannot be negative', 'commission_percentage', 'INVALID'));
      } else if (data.commission_percentage > 100) {
        errors.push(new TaskValidationError('Commission percentage cannot exceed 100%', 'commission_percentage', 'MAX_VALUE'));
      }
    }

    if (data.due_date && !this.isValidDateString(data.due_date)) {
      errors.push(new TaskValidationError('Due date must be a valid ISO date string', 'due_date', 'INVALID_FORMAT'));
    }

    if (data.notes && typeof data.notes !== 'string') {
      errors.push(new TaskValidationError('Notes must be a string', 'notes', 'INVALID_TYPE'));
    } else if (data.notes && data.notes.length > 2000) {
      errors.push(new TaskValidationError('Notes must not exceed 2000 characters', 'notes', 'MAX_LENGTH'));
    }

    if (errors.length > 0) {
      throw errors[0]; // Throw the first error
    }
  }

  /**
   * Validate task update request
   */
  static validateUpdateTask(data: UpdateTaskRequest): void {
    const errors: TaskValidationError[] = [];

    // Title validation (optional)
    if (data.title !== undefined) {
      if (typeof data.title !== 'string') {
        errors.push(new TaskValidationError('Title must be a string', 'title', 'INVALID_TYPE'));
      } else if (data.title.trim().length < 3) {
        errors.push(new TaskValidationError('Title must be at least 3 characters long', 'title', 'MIN_LENGTH'));
      } else if (data.title.trim().length > 255) {
        errors.push(new TaskValidationError('Title must not exceed 255 characters', 'title', 'MAX_LENGTH'));
      }
    }

    // Optional field validations
    if (data.description !== undefined && typeof data.description !== 'string') {
      errors.push(new TaskValidationError('Description must be a string', 'description', 'INVALID_TYPE'));
    } else if (data.description && data.description.length > 2000) {
      errors.push(new TaskValidationError('Description must not exceed 2000 characters', 'description', 'MAX_LENGTH'));
    }

    if (data.assigned_to !== undefined) {
      if (typeof data.assigned_to !== 'string') {
        errors.push(new TaskValidationError('Assigned to must be a string', 'assigned_to', 'INVALID_TYPE'));
      } else if (data.assigned_to.trim().length === 0) {
        errors.push(new TaskValidationError('Assigned to cannot be empty', 'assigned_to', 'EMPTY'));
      }
    }

    if (data.priority !== undefined && !this.isValidPriority(data.priority)) {
      errors.push(new TaskValidationError(
        'Invalid priority. Must be one of: urgent, high, medium, low',
        'priority',
        'INVALID'
      ));
    }

    if (data.status !== undefined && !this.isValidStatus(data.status)) {
      errors.push(new TaskValidationError(
        'Invalid status. Must be one of: pending, assigned, in_progress, completed, cancelled',
        'status',
        'INVALID'
      ));
    }

    if (data.payment_status !== undefined && !this.isValidPaymentStatus(data.payment_status)) {
      errors.push(new TaskValidationError(
        'Invalid payment status. Must be one of: unpaid, pending, paid',
        'payment_status',
        'INVALID'
      ));
    }

    if (data.commission_amount !== undefined) {
      if (typeof data.commission_amount !== 'number') {
        errors.push(new TaskValidationError('Commission amount must be a number', 'commission_amount', 'INVALID_TYPE'));
      } else if (data.commission_amount < 0) {
        errors.push(new TaskValidationError('Commission amount cannot be negative', 'commission_amount', 'INVALID'));
      } else if (data.commission_amount > 999999.99) {
        errors.push(new TaskValidationError('Commission amount cannot exceed 999,999.99', 'commission_amount', 'MAX_VALUE'));
      }
    }

    if (data.commission_percentage !== undefined) {
      if (typeof data.commission_percentage !== 'number') {
        errors.push(new TaskValidationError('Commission percentage must be a number', 'commission_percentage', 'INVALID_TYPE'));
      } else if (data.commission_percentage < 0) {
        errors.push(new TaskValidationError('Commission percentage cannot be negative', 'commission_percentage', 'INVALID'));
      } else if (data.commission_percentage > 100) {
        errors.push(new TaskValidationError('Commission percentage cannot exceed 100%', 'commission_percentage', 'MAX_VALUE'));
      }
    }

    if (data.due_date !== undefined && !this.isValidDateString(data.due_date)) {
      errors.push(new TaskValidationError('Due date must be a valid ISO date string', 'due_date', 'INVALID_FORMAT'));
    }

    if (data.completed_date !== undefined && !this.isValidDateString(data.completed_date)) {
      errors.push(new TaskValidationError('Completed date must be a valid ISO date string', 'completed_date', 'INVALID_FORMAT'));
    }

    if (data.notes !== undefined && typeof data.notes !== 'string') {
      errors.push(new TaskValidationError('Notes must be a string', 'notes', 'INVALID_TYPE'));
    } else if (data.notes && data.notes.length > 2000) {
      errors.push(new TaskValidationError('Notes must not exceed 2000 characters', 'notes', 'MAX_LENGTH'));
    }

    if (errors.length > 0) {
      throw errors[0];
    }
  }

  /**
   * Validate task assignment request
   */
  static validateAssignTask(data: AssignTaskRequest): void {
    const errors: TaskValidationError[] = [];

    if (!data.assigned_to || typeof data.assigned_to !== 'string') {
      errors.push(new TaskValidationError('Assigned to is required', 'assigned_to', 'REQUIRED'));
    } else if (data.assigned_to.trim().length === 0) {
      errors.push(new TaskValidationError('Assigned to cannot be empty', 'assigned_to', 'EMPTY'));
    }

    if (data.notes !== undefined && typeof data.notes !== 'string') {
      errors.push(new TaskValidationError('Notes must be a string', 'notes', 'INVALID_TYPE'));
    } else if (data.notes && data.notes.length > 2000) {
      errors.push(new TaskValidationError('Notes must not exceed 2000 characters', 'notes', 'MAX_LENGTH'));
    }

    if (errors.length > 0) {
      throw errors[0];
    }
  }

  /**
   * Validate task filters
   */
  static validateTaskFilters(filters: TaskFilters): void {
    const errors: TaskValidationError[] = [];

    if (filters.client_id !== undefined) {
      if (typeof filters.client_id !== 'number' || filters.client_id <= 0) {
        errors.push(new TaskValidationError('Client ID must be a positive number', 'client_id', 'INVALID'));
      }
    }

    if (filters.priority !== undefined && !this.isValidPriority(filters.priority)) {
      errors.push(new TaskValidationError('Invalid priority filter', 'priority', 'INVALID'));
    }

    if (filters.status !== undefined && !this.isValidStatus(filters.status)) {
      errors.push(new TaskValidationError('Invalid status filter', 'status', 'INVALID'));
    }

    if (filters.task_type !== undefined && !this.isValidTaskType(filters.task_type)) {
      errors.push(new TaskValidationError('Invalid task type filter', 'task_type', 'INVALID'));
    }

    if (filters.payment_status !== undefined && !this.isValidPaymentStatus(filters.payment_status)) {
      errors.push(new TaskValidationError('Invalid payment status filter', 'payment_status', 'INVALID'));
    }

    // Date validations
    const dateFields = ['due_date_from', 'due_date_to', 'created_from', 'created_to'] as const;
    for (const field of dateFields) {
      if (filters[field] !== undefined && !this.isValidDateString(filters[field]!)) {
        errors.push(new TaskValidationError(`${field} must be a valid ISO date string`, field, 'INVALID_FORMAT'));
      }
    }

    if (filters.search !== undefined && typeof filters.search !== 'string') {
      errors.push(new TaskValidationError('Search must be a string', 'search', 'INVALID_TYPE'));
    }

    if (errors.length > 0) {
      throw errors[0];
    }
  }

  /**
   * Validate pagination options
   */
  static validatePaginationOptions(options: TaskPaginationOptions): void {
    const errors: TaskValidationError[] = [];

    if (options.page !== undefined) {
      if (typeof options.page !== 'number' || options.page < 1) {
        errors.push(new TaskValidationError('Page must be a positive number', 'page', 'INVALID'));
      }
    }

    if (options.limit !== undefined) {
      if (typeof options.limit !== 'number' || options.limit < 1 || options.limit > 100) {
        errors.push(new TaskValidationError('Limit must be between 1 and 100', 'limit', 'INVALID'));
      }
    }

    if (options.sort_by !== undefined) {
      const validSortFields = ['created_at', 'updated_at', 'due_date', 'priority', 'status', 'title'];
      if (!validSortFields.includes(options.sort_by)) {
        errors.push(new TaskValidationError(
          `Sort by must be one of: ${validSortFields.join(', ')}`,
          'sort_by',
          'INVALID'
        ));
      }
    }

    if (options.sort_order !== undefined) {
      if (!['asc', 'desc'].includes(options.sort_order)) {
        errors.push(new TaskValidationError('Sort order must be "asc" or "desc"', 'sort_order', 'INVALID'));
      }
    }

    if (errors.length > 0) {
      throw errors[0];
    }
  }

  // Helper validation methods
  private static isValidPriority(priority: string): priority is TaskPriority {
    return ['urgent', 'high', 'medium', 'low'].includes(priority);
  }

  private static isValidStatus(status: string): status is TaskStatus {
    return ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'].includes(status);
  }

  private static isValidTaskType(taskType: string): taskType is TaskType {
    return [
      'fingerprint',
      'medical_exam',
      'document_review',
      'interview',
      'translation',
      'notarization',
      'background_check',
      'photo_service'
    ].includes(taskType);
  }

  private static isValidPaymentStatus(paymentStatus: string): paymentStatus is PaymentStatus {
    return ['unpaid', 'pending', 'paid'].includes(paymentStatus);
  }

  private static isValidDateString(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString === date.toISOString();
  }
}