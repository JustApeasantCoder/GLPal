export { useWeightMetrics } from './useWeightMetrics';
export { useFilteredWeights, type ChartPeriod } from './useFilteredWeights';
export { useMedicationChartData, useWeightChartData } from './useChartDataProcessor';
export { useChartDateRange, useWeightChartDateRange } from './useChartDateRange';
export { useAppData } from './useAppData';
export { useUnitConversion, createUnitConverter } from './useUnitConversion';
export { 
  useFormValidation, 
  createFormValidator,
  COMMON_VALIDATION,
  sanitizeNumericInput,
  parseNumber,
  formatNumber
} from './useFormValidation';