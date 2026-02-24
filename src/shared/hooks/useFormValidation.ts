import { useMemo, useCallback } from 'react';
import { UnitSystem } from '../../types';

// Validation rule types
interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface ValidationErrors {
  [fieldName: string]: string;
}

interface FieldConfig {
  validation?: ValidationRule;
  transform?: (value: any) => any;
  sanitize?: (value: string) => string;
}

interface FormConfig {
  [fieldName: string]: FieldConfig;
}

// Common validation patterns
export const COMMON_VALIDATION = {
  required: { required: true },
  positiveNumber: { min: 0.01, custom: (v: number) => v > 0 ? null : 'Must be greater than 0' },
  age: { required: true, min: 1, max: 120 },
  weightMetric: { required: true, min: 30, max: 500, step: 0.1 },
  weightImperial: { required: true, min: 66, max: 660, step: 0.1 },
  heightMetric: { required: true, min: 50, max: 250 },
  heightImperialInches: { min: 0, max: 11 },
  heightImperialFeet: { min: 1, max: 9 },
  goalWeightMetric: { min: 30, max: 300, step: 0.1 },
  goalWeightImperial: { min: 66, max: 660, step: 0.1 },
  dosageMg: { required: true, min: 0.1, max: 50, step: 0.1 },
  vialCapacity: { required: true, min: 1, max: 50, step: 0.1 },
  bacteriostaticWater: { required: true, min: 0.1, max: 50, step: 0.1 }
} as const;

// Utility functions
export const sanitizeNumericInput = (value: string): string => {
  return value.replace(/[^0-9.-]/g, '').replace(/(?!^)-/g, '');
};

export const parseNumber = (value: string, fallback = 0): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

export const formatNumber = (value: number, decimalPlaces = 1): string => {
  return value % 1 === 0 ? value.toString() : value.toFixed(decimalPlaces);
};

// Main hook
export const useFormValidation = <T extends Record<string, any>>(
  config: FormConfig,
  unitSystem?: UnitSystem
) => {
  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const fieldConfig = config[fieldName];
    if (!fieldConfig?.validation) return null;

    const { validation } = fieldConfig;
    
    // Required validation
    if (validation.required && (!value || value === '')) {
      return 'This field is required';
    }

    // Skip other validations if empty and not required
    if (!value || value === '') return null;

    // Transform value if needed
    let transformedValue = value;
    if (fieldConfig.transform) {
      transformedValue = fieldConfig.transform(value);
    }

    // Type-specific validations
    const numValue = typeof transformedValue === 'string' ? parseNumber(transformedValue) : transformedValue;

    if (validation.min !== undefined && numValue < validation.min) {
      return `Must be at least ${validation.min}`;
    }

    if (validation.max !== undefined && numValue > validation.max) {
      return `Must be no more than ${validation.max}`;
    }

    if (validation.step !== undefined && numValue % validation.step !== 0) {
      return `Must be in increments of ${validation.step}`;
    }

    if (validation.pattern && typeof value === 'string' && !validation.pattern.test(value)) {
      return 'Invalid format';
    }

    // Custom validation
    if (validation.custom) {
      return validation.custom(transformedValue);
    }

    return null;
  }, [config]);

  const validateForm = useCallback((formData: T): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    Object.keys(config).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        errors[fieldName] = error;
      }
    });

    return errors;
  }, [config, validateField]);

  const sanitizeInput = useCallback((fieldName: string, value: string): string => {
    const fieldConfig = config[fieldName];
    if (fieldConfig?.sanitize) {
      return fieldConfig.sanitize(value);
    }
    return value;
  }, [config]);

  const createFieldProps = useCallback((fieldName: string) => {
    const fieldConfig = config[fieldName];
    return {
      validate: (value: any) => validateField(fieldName, value),
      sanitize: (value: string) => sanitizeInput(fieldName, value),
      transform: (value: any) => fieldConfig?.transform ? fieldConfig.transform(value) : value,
      ...(fieldConfig?.validation || {})
    };
  }, [config, validateField, sanitizeInput]);

  // Pre-built form configs for common forms
  const formConfigs = useMemo(() => ({
    weightInput: {
      weight: {
        validation: unitSystem === 'imperial' 
          ? COMMON_VALIDATION.weightImperial 
          : COMMON_VALIDATION.weightMetric,
        sanitize: sanitizeNumericInput,
        transform: parseNumber
      }
    },
    
    tdeeCalculator: {
      age: { validation: COMMON_VALIDATION.age, transform: parseNumber },
      height: {
        validation: unitSystem === 'imperial' 
          ? COMMON_VALIDATION.heightMetric 
          : COMMON_VALIDATION.heightImperialFeet,
        transform: parseNumber
      },
      gender: { validation: COMMON_VALIDATION.required },
      activityLevel: { validation: COMMON_VALIDATION.required, transform: parseFloat }
    },

    dosageCalculator: {
      vialCapacity: { 
        validation: COMMON_VALIDATION.vialCapacity, 
        sanitize: sanitizeNumericInput,
        transform: parseNumber 
      },
      bacteriostaticWater: { 
        validation: COMMON_VALIDATION.bacteriostaticWater, 
        sanitize: sanitizeNumericInput,
        transform: parseNumber 
      },
      desiredDose: { 
        validation: COMMON_VALIDATION.dosageMg, 
        sanitize: sanitizeNumericInput,
        transform: parseNumber 
      }
    },

    goalWeight: {
      goalWeight: {
        validation: unitSystem === 'imperial' 
          ? COMMON_VALIDATION.goalWeightImperial 
          : COMMON_VALIDATION.goalWeightMetric,
        sanitize: sanitizeNumericInput,
        transform: parseNumber
      }
    }
  }), [unitSystem]);

  return {
    validateField,
    validateForm,
    sanitizeInput,
    createFieldProps,
    formConfigs,
    utils: {
      sanitizeNumericInput,
      parseNumber,
      formatNumber
    }
  };
};

// Non-hook utility for non-react usage
export const createFormValidator = <T extends Record<string, any>>(
  config: FormConfig,
  unitSystem?: UnitSystem
) => {
  const validateField = (fieldName: string, value: any): string | null => {
    const fieldConfig = config[fieldName];
    if (!fieldConfig?.validation) return null;

    const { validation } = fieldConfig;
    
    // Required validation
    if (validation.required && (!value || value === '')) {
      return 'This field is required';
    }

    // Skip other validations if empty and not required
    if (!value || value === '') return null;

    // Transform value if needed
    let transformedValue = value;
    if (fieldConfig.transform) {
      transformedValue = fieldConfig.transform(value);
    }

    // Type-specific validations
    const numValue = typeof transformedValue === 'string' ? parseNumber(transformedValue) : transformedValue;

    if (validation.min !== undefined && numValue < validation.min) {
      return `Must be at least ${validation.min}`;
    }

    if (validation.max !== undefined && numValue > validation.max) {
      return `Must be no more than ${validation.max}`;
    }

    if (validation.step !== undefined && numValue % validation.step !== 0) {
      return `Must be in increments of ${validation.step}`;
    }

    if (validation.pattern && typeof value === 'string' && !validation.pattern.test(value)) {
      return 'Invalid format';
    }

    // Custom validation
    if (validation.custom) {
      return validation.custom(transformedValue);
    }

    return null;
  };

  const validateForm = (formData: T): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    Object.keys(config).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        errors[fieldName] = error;
      }
    });

    return errors;
  };

  const sanitizeInput = (fieldName: string, value: string): string => {
    const fieldConfig = config[fieldName];
    if (fieldConfig?.sanitize) {
      return fieldConfig.sanitize(value);
    }
    return value;
  };

  return {
    validateField,
    validateForm,
    sanitizeInput,
    utils: {
      sanitizeNumericInput,
      parseNumber,
      formatNumber
    }
  };
};