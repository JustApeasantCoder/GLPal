import { renderHook } from '@testing-library/react';
import { useUnitConversion } from './useUnitConversion';

describe('useUnitConversion', () => {
  it('should provide metric unit conversions', () => {
    const { result } = renderHook(() => useUnitConversion({ unitSystem: 'metric' }));
    
    expect(result.current.unitSystem).toBe('metric');
    expect(result.current.isMetric).toBe(true);
    expect(result.current.isImperial).toBe(false);
    expect(result.current.convertWeight.getUnit()).toBe('kg');
    expect(result.current.convertWeight.getMaxValue()).toBe(500);
  });

  it('should provide imperial unit conversions', () => {
    const { result } = renderHook(() => useUnitConversion({ unitSystem: 'imperial' }));
    
    expect(result.current.unitSystem).toBe('imperial');
    expect(result.current.isMetric).toBe(false);
    expect(result.current.isImperial).toBe(true);
    expect(result.current.convertWeight.getUnit()).toBe('lbs');
    expect(result.current.convertWeight.getMaxValue()).toBe(1100);
  });

  it('should format goal weight correctly', () => {
    const { result } = renderHook(() => useUnitConversion({ unitSystem: 'imperial' }));
    
    const formatted = result.current.manageGoalWeight.formatForDisplay(70); // 70kg
    expect(formatted).toBe('154.1'); // 70kg = 154.1lbs
    
    const parsed = result.current.manageGoalWeight.parseFromDisplay('154.1');
    expect(parsed).toBe(70);
  });

  it('should handle empty goal weight values', () => {
    const { result } = renderHook(() => useUnitConversion({ unitSystem: 'metric' }));
    
    expect(result.current.manageGoalWeight.formatForDisplay(undefined)).toBe('');
    expect(result.current.manageGoalWeight.parseFromDisplay('')).toBe(undefined);
  });
});