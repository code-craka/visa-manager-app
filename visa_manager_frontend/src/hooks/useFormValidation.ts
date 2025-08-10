// Form Validation Hook for Client Management
// Requirements: 1.3, 3.4, 3.5

import { useState, useCallback, useMemo, useEffect } from 'react';
import { VisaType, ClientStatus } from '../types/Client';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
  message?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export interface ValidationState {
  errors: ValidationErrors;
  isValid: boolean;
  isValidating: boolean;
  touchedFields: Set<string>;
}

// Client-specific validation schema
export const clientValidationSchema: ValidationSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 255,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Name must be 2-255 characters and contain only letters, spaces, hyphens, and apostrophes',
  },
  email: {
    required: true,
    maxLength: 255,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address (max 255 characters)',
  },
  phone: {
    required: false,
    maxLength: 50,
    pattern: /^\+?[\d\s\-\(\)]+$/,
    message: 'Phone number can contain digits, spaces, hyphens, parentheses, and optional + prefix (max 50 characters)',
  },
  visaType: {
    required: true,
    custom: (value) => {
      if (!value || !Object.values(VisaType).includes(value)) {
        return 'Please select a valid visa type';
      }
      return undefined;
    },
  },
  status: {
    required: true,
    custom: (value) => {
      if (!value || !Object.values(ClientStatus).includes(value)) {
        return 'Please select a valid status';
      }
      return undefined;
    },
  },
  notes: {
    required: false,
    maxLength: 2000,
    message: 'Notes must not exceed 2000 characters',
  },
};

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  schema: ValidationSchema,
  options: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    debounceMs?: number;
  } = {}
) {
  const { validateOnChange = true, validateOnBlur = true, debounceMs = 300 } = options;

  const [formData, setFormData] = useState<T>(initialData);
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: {},
    isValid: true,
    isValidating: false,
    touchedFields: new Set(),
  });

  // Debounced validation timer
  const [validationTimer, setValidationTimer] = useState<NodeJS.Timeout | null>(null);

  // Validate a single field
  const validateField = useCallback((fieldName: string, value: any): string | undefined => {
    const rule = schema[fieldName];
    if (!rule) return undefined;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return undefined;
    }

    // String-specific validations
    if (typeof value === 'string') {
      // Min length validation
      if (rule.minLength && value.trim().length < rule.minLength) {
        return rule.message || `${fieldName} must be at least ${rule.minLength} characters long`;
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message || `${fieldName} must not exceed ${rule.maxLength} characters`;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || `${fieldName} format is invalid`;
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        return customError;
      }
    }

    return undefined;
  }, [schema]);

  // Validate all fields
  const validateForm = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};

    Object.keys(schema).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        errors[fieldName] = error;
      }
    });

    return errors;
  }, [formData, schema, validateField]);

  // Debounced validation function
  const debouncedValidation = useCallback((fieldName?: string) => {
    if (validationTimer) {
      clearTimeout(validationTimer);
    }

    setValidationState(prev => ({ ...prev, isValidating: true }));

    const timer = setTimeout(() => {
      if (fieldName) {
        // Validate single field
        const error = validateField(fieldName, formData[fieldName]);
        setValidationState(prev => ({
          ...prev,
          errors: { ...prev.errors, [fieldName]: error },
          isValidating: false,
        }));
      } else {
        // Validate all fields
        const errors = validateForm();
        const isValid = Object.values(errors).every(error => !error);
        setValidationState(prev => ({
          ...prev,
          errors,
          isValid,
          isValidating: false,
        }));
      }
    }, debounceMs);

    setValidationTimer(timer);
  }, [formData, validateField, validateForm, validationTimer, debounceMs]);

  // Update form data and trigger validation
  const updateField = useCallback((fieldName: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    if (validateOnChange) {
      debouncedValidation(fieldName as string);
    }
  }, [validateOnChange, debouncedValidation]);

  // Handle field blur (touch)
  const touchField = useCallback((fieldName: keyof T) => {
    setValidationState(prev => ({
      ...prev,
      touchedFields: new Set([...prev.touchedFields, fieldName as string]),
    }));

    if (validateOnBlur) {
      debouncedValidation(fieldName as string);
    }
  }, [validateOnBlur, debouncedValidation]);

  // Validate entire form (useful for form submission)
  const validateAll = useCallback((): boolean => {
    const errors = validateForm();
    const isValid = Object.values(errors).every(error => !error);

    // Mark all fields as touched
    const allFields = new Set(Object.keys(schema));

    setValidationState(prev => ({
      ...prev,
      errors,
      isValid,
      touchedFields: allFields,
      isValidating: false,
    }));

    return isValid;
  }, [validateForm, schema]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setValidationState({
      errors: {},
      isValid: true,
      isValidating: false,
      touchedFields: new Set(),
    });

    if (validationTimer) {
      clearTimeout(validationTimer);
      setValidationTimer(null);
    }
  }, [initialData, validationTimer]);

  // Reset validation state only
  const resetValidation = useCallback(() => {
    setValidationState({
      errors: {},
      isValid: true,
      isValidating: false,
      touchedFields: new Set(),
    });

    if (validationTimer) {
      clearTimeout(validationTimer);
      setValidationTimer(null);
    }
  }, [validationTimer]);

  // Get error for a specific field (only if field has been touched)
  const getFieldError = useCallback((fieldName: keyof T): string | undefined => {
    const fieldNameStr = fieldName as string;
    if (!validationState.touchedFields.has(fieldNameStr)) {
      return undefined;
    }
    return validationState.errors[fieldNameStr];
  }, [validationState.errors, validationState.touchedFields]);

  // Check if a field has been touched
  const isFieldTouched = useCallback((fieldName: keyof T): boolean => {
    return validationState.touchedFields.has(fieldName as string);
  }, [validationState.touchedFields]);

  // Get validation status for a field
  const getFieldStatus = useCallback((fieldName: keyof T) => {
    const fieldNameStr = fieldName as string;
    const isTouched = validationState.touchedFields.has(fieldNameStr);
    const error = validationState.errors[fieldNameStr];

    return {
      isTouched,
      hasError: isTouched && !!error,
      error: isTouched ? error : undefined,
      isValid: isTouched && !error,
    };
  }, [validationState.errors, validationState.touchedFields]);

  // Memoized computed values
  const computedValues = useMemo(() => ({
    hasErrors: Object.values(validationState.errors).some(error => !!error),
    touchedFieldsCount: validationState.touchedFields.size,
    totalFieldsCount: Object.keys(schema).length,
    completionPercentage: (validationState.touchedFields.size / Object.keys(schema).length) * 100,
  }), [validationState.errors, validationState.touchedFields, schema]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (validationTimer) {
        clearTimeout(validationTimer);
      }
    };
  }, [validationTimer]);

  return {
    // Form data
    formData,
    setFormData,

    // Validation state
    ...validationState,
    ...computedValues,

    // Field operations
    updateField,
    touchField,
    getFieldError,
    isFieldTouched,
    getFieldStatus,

    // Form operations
    validateAll,
    resetForm,
    resetValidation,

    // Validation functions
    validateField,
    validateForm,
  };
}

// Specialized hook for client form validation
export function useClientFormValidation(initialData: any) {
  return useFormValidation(initialData, clientValidationSchema, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
  });
}

export default useFormValidation;