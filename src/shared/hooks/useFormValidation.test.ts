import { renderHook } from '@testing-library/react';
import { useFormValidation } from './useFormValidation';

describe('useFormValidation', () => {
  it('should validate required fields', () => {
    const { result } = renderHook(() => 
      useFormValidation({ name: { validation: { required: true } } })
    );
    
    expect(result.current.validateField('name', '')).toBe('This field is required');
    expect(result.current.validateField('name', 'John')).toBe(null);
  });

  it('should validate number ranges', () => {
    const { result } = renderHook(() => 
      useFormValidation({ 
        age: { validation: { min: 1, max: 120, required: true } }
      })
    );
    
    expect(result.current.validateField('age', 0)).toBe('Must be at least 1');
    expect(result.current.validateField('age', 121)).toBe('Must be no more than 120');
    expect(result.current.validateField('age', 25)).toBe(null);
  });

  it('should validate complete forms', () => {
    const { result } = renderHook(() => 
      useFormValidation({ 
        name: { validation: { required: true } },
        age: { validation: { min: 1, max: 120, required: true } }
      })
    );
    
    const validForm = { name: 'John', age: 25 };
    expect(result.current.validateForm(validForm)).toEqual({});
    
    const invalidForm = { name: '', age: 0 };
    const errors = result.current.validateForm(invalidForm);
    expect(errors.name).toBe('This field is required');
    expect(errors.age).toBe('Must be at least 1');
  });

  it('should sanitize numeric input', () => {
    const { result } = renderHook(() => 
      useFormValidation({ 
        weight: { sanitize: (value: string) => value.replace(/[^0-9.-]/g, '').replace(/(?!^)-/g, '') }
      })
    );
    
    expect(result.current.sanitizeInput('weight', '12.3.4abc')).toBe('12.34');
    expect(result.current.sanitizeInput('weight', '')).toBe('');
  });
});