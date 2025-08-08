// Client validation schemas and utilities
// Requirements: 1.3, 3.4, 3.5

import { VisaType, ClientStatus, CreateClientRequest, UpdateClientRequest } from './Client';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const clientValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 255,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Name must be 2-255 characters and contain only letters, spaces, hyphens, and apostrophes'
  },
  email: {
    required: true,
    maxLength: 255,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Valid email address is required (max 255 characters)'
  },
  phone: {
    required: false,
    maxLength: 50,
    pattern: /^\+?[\d\s\-\(\)]+$/,
    message: 'Phone number can contain digits, spaces, hyphens, parentheses, and optional + prefix (max 50 characters)'
  },
  visa_type: {
    required: true,
    enum: Object.values(VisaType),
    message: 'Valid visa type is required'
  },
  visaType: {
    required: true,
    enum: Object.values(VisaType),
    message: 'Valid visa type is required'
  },
  status: {
    required: false,
    enum: Object.values(ClientStatus),
    message: 'Valid client status is required'
  },
  notes: {
    required: false,
    maxLength: 2000,
    message: 'Notes must not exceed 2000 characters'
  }
};

export const validateCreateClientRequest = (data: CreateClientRequest): ValidationResult => {
  const errors: string[] = [];

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  } else {
    if (data.name.trim().length < clientValidationRules.name.minLength) {
      errors.push(`Name must be at least ${clientValidationRules.name.minLength} characters long`);
    }
    if (data.name.length > clientValidationRules.name.maxLength) {
      errors.push(`Name must not exceed ${clientValidationRules.name.maxLength} characters`);
    }
    if (!clientValidationRules.name.pattern.test(data.name)) {
      errors.push(clientValidationRules.name.message);
    }
  }

  // Validate email
  if (!data.email || data.email.trim().length === 0) {
    errors.push('Email is required');
  } else {
    if (data.email.length > clientValidationRules.email.maxLength) {
      errors.push(`Email must not exceed ${clientValidationRules.email.maxLength} characters`);
    }
    if (!clientValidationRules.email.pattern.test(data.email)) {
      errors.push('Invalid email format');
    }
  }

  // Validate phone (optional)
  if (data.phone && data.phone.trim().length > 0) {
    if (data.phone.length > clientValidationRules.phone.maxLength) {
      errors.push(`Phone number must not exceed ${clientValidationRules.phone.maxLength} characters`);
    }
    if (!clientValidationRules.phone.pattern.test(data.phone)) {
      errors.push(clientValidationRules.phone.message);
    }
  }

  // Validate visaType
  if (!data.visaType) {
    errors.push('Visa type is required');
  } else if (!clientValidationRules.visaType.enum.includes(data.visaType)) {
    errors.push('Invalid visa type');
  }

  // Validate status (optional, defaults to pending)
  if (data.status && !clientValidationRules.status.enum.includes(data.status)) {
    errors.push('Invalid client status');
  }

  // Validate notes (optional)
  if (data.notes && data.notes.length > clientValidationRules.notes.maxLength) {
    errors.push(`Notes must not exceed ${clientValidationRules.notes.maxLength} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUpdateClientRequest = (data: UpdateClientRequest): ValidationResult => {
  const errors: string[] = [];

  // Validate name (if provided)
  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name cannot be empty');
    } else {
      if (data.name.trim().length < clientValidationRules.name.minLength) {
        errors.push(`Name must be at least ${clientValidationRules.name.minLength} characters long`);
      }
      if (data.name.length > clientValidationRules.name.maxLength) {
        errors.push(`Name must not exceed ${clientValidationRules.name.maxLength} characters`);
      }
      if (!clientValidationRules.name.pattern.test(data.name)) {
        errors.push(clientValidationRules.name.message);
      }
    }
  }

  // Validate email (if provided)
  if (data.email !== undefined) {
    if (!data.email || data.email.trim().length === 0) {
      errors.push('Email cannot be empty');
    } else {
      if (data.email.length > clientValidationRules.email.maxLength) {
        errors.push(`Email must not exceed ${clientValidationRules.email.maxLength} characters`);
      }
      if (!clientValidationRules.email.pattern.test(data.email)) {
        errors.push('Invalid email format');
      }
    }
  }

  // Validate phone (if provided)
  if (data.phone !== undefined && data.phone && data.phone.trim().length > 0) {
    if (data.phone.length > clientValidationRules.phone.maxLength) {
      errors.push(`Phone number must not exceed ${clientValidationRules.phone.maxLength} characters`);
    }
    if (!clientValidationRules.phone.pattern.test(data.phone)) {
      errors.push(clientValidationRules.phone.message);
    }
  }

  // Validate visaType (if provided)
  if (data.visaType !== undefined && !clientValidationRules.visaType.enum.includes(data.visaType)) {
    errors.push('Invalid visa type');
  }

  // Validate status (if provided)
  if (data.status !== undefined && !clientValidationRules.status.enum.includes(data.status)) {
    errors.push('Invalid client status');
  }

  // Validate notes (if provided)
  if (data.notes !== undefined && data.notes && data.notes.length > clientValidationRules.notes.maxLength) {
    errors.push(`Notes must not exceed ${clientValidationRules.notes.maxLength} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize client data
export const sanitizeClientData = (data: CreateClientRequest | UpdateClientRequest): CreateClientRequest | UpdateClientRequest => {
  const sanitized = { ...data };

  // Trim string fields
  if ('name' in sanitized && sanitized.name) {
    sanitized.name = sanitized.name.trim();
  }
  if ('email' in sanitized && sanitized.email) {
    sanitized.email = sanitized.email.trim().toLowerCase();
  }
  if ('phone' in sanitized && sanitized.phone) {
    sanitized.phone = sanitized.phone.trim();
  }
  if ('notes' in sanitized && sanitized.notes) {
    sanitized.notes = sanitized.notes.trim();
  }

  return sanitized;
};