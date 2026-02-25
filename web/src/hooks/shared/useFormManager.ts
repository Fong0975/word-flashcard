import { useState, useCallback, useEffect } from 'react';

/**
 * Form field value type
 */
export type FormFieldValue = string | number | boolean | string[] | null | undefined;

/**
 * Form data interface
 */
export interface FormData {
  [key: string]: FormFieldValue;
}

/**
 * Form validation rule
 */
export interface ValidationRule<T = FormFieldValue> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T, formData: FormData) => string | null;
}

/**
 * Form validation rules
 */
export interface ValidationRules {
  [fieldName: string]: ValidationRule;
}

/**
 * Form validation errors
 */
export interface ValidationErrors {
  [fieldName: string]: string;
}

/**
 * Form configuration
 */
export interface FormConfig<T extends FormData> {
  initialValues: T;
  validationRules?: ValidationRules;
  resetOnSuccess?: boolean;
}

/**
 * Form submission options
 */
export interface SubmitOptions {
  skipValidation?: boolean;
}

/**
 * Form manager return type
 */
export interface UseFormManagerReturn<T extends FormData> {
  // Form data
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  updateField: (fieldName: keyof T, value: FormFieldValue) => void;
  resetForm: (newInitialValues?: Partial<T>) => void;

  // Validation
  errors: ValidationErrors;
  isValid: boolean;
  validateField: (fieldName: keyof T) => string | null;
  validateForm: () => boolean;
  clearErrors: () => void;

  // Submission
  isSubmitting: boolean;
  submitError: string | null;
  handleSubmit: (
    submitFn: (data: T) => Promise<void>,
    options?: SubmitOptions
  ) => Promise<boolean>;
  setSubmitting: (submitting: boolean) => void;
  setSubmitError: (error: string | null) => void;
}

/**
 * Generic hook for managing form state, validation, and submission
 *
 * Provides comprehensive form management including:
 * - Form data state management
 * - Validation with customizable rules
 * - Submission handling with loading and error states
 * - Form reset functionality
 *
 * @example
 * ```tsx
 * const formManager = useFormManager({
 *   initialValues: { word: '', familiarity: 'green' },
 *   validationRules: {
 *     word: { required: true, minLength: 1 }
 *   },
 *   resetOnSuccess: true
 * });
 *
 * const handleSubmit = async () => {
 *   const success = await formManager.handleSubmit(async (data) => {
 *     await apiService.createWord(data);
 *   });
 *   if (success) {
 *     onWordSaved?.();
 *   }
 * };
 * ```
 */
export const useFormManager = <T extends FormData>({
  initialValues,
  validationRules = {},
  resetOnSuccess = false,
}: FormConfig<T>): UseFormManagerReturn<T> => {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Update individual field
  const updateField = useCallback((fieldName: keyof T, value: FormFieldValue) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear field error when value changes
    if (errors[fieldName as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName as string];
        return newErrors;
      });
    }
  }, [errors]);

  // Reset form to initial or new values
  const resetForm = useCallback((newInitialValues?: Partial<T>) => {
    const resetValues = newInitialValues
      ? { ...initialValues, ...newInitialValues }
      : initialValues;
    setFormData(resetValues as T);
    setErrors({});
    setSubmitError(null);
  }, [initialValues]);

  // Validate individual field
  const validateField = useCallback((fieldName: keyof T): string | null => {
    const fieldNameStr = fieldName as string;
    const value = formData[fieldName];
    const rule = validationRules[fieldNameStr];

    if (!rule) return null;

    // Required validation
    if (rule.required && (value === null || value === undefined || value === '')) {
      return 'This field is required';
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.required) return null;

    const stringValue = String(value);

    // Min length validation
    if (rule.minLength && stringValue.length < rule.minLength) {
      return `Must be at least ${rule.minLength} characters`;
    }

    // Max length validation
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return `Must be no more than ${rule.maxLength} characters`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return 'Invalid format';
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value, formData);
    }

    return null;
  }, [formData, validationRules]);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isFormValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName as keyof T);
      if (error) {
        newErrors[fieldName] = error;
        isFormValid = false;
      }
    });

    setErrors(newErrors);
    return isFormValid;
  }, [validateField, validationRules]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
    setSubmitError(null);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (
    submitFn: (data: T) => Promise<void>,
    options: SubmitOptions = {}
  ): Promise<boolean> => {
    const { skipValidation = false } = options;

    // Validate form unless skipped
    if (!skipValidation && !validateForm()) {
      return false;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await submitFn(formData);

      // Reset form on success if configured
      if (resetOnSuccess) {
        resetForm();
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setSubmitError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, resetOnSuccess, resetForm]);

  // Compute derived state
  const isValid = Object.keys(errors).length === 0;

  return {
    // Form data
    formData,
    setFormData,
    updateField,
    resetForm,

    // Validation
    errors,
    isValid,
    validateField,
    validateForm,
    clearErrors,

    // Submission
    isSubmitting,
    submitError,
    handleSubmit,
    setSubmitting: setIsSubmitting,
    setSubmitError,
  };
};