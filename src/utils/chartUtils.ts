import { useMemo } from 'react';
import { WeightEntry, GLP1Entry } from '../types';

// Date formatting utilities
export const CHART_DATE_FORMATS = {
  short: (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  medium: (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
  long: (date: Date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  iso: (date: Date) => date.toISOString().split('T')[0],
  display: (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
} as const;

// Chart data processing
export const processWeightChartData = (data: WeightEntry[], unitSystem: 'metric' | 'imperial' = 'metric') => {
  if (!data.length) return [];

  return data
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => {
      const date = new Date(entry.date);
      return {
        ...entry,
        date: entry.date,
        displayDate: CHART_DATE_FORMATS.short(date),
        formattedDate: CHART_DATE_FORMATS.display(date),
        weight: entry.weight,
        displayWeight: unitSystem === 'imperial' 
          ? Math.round(entry.weight * 2.20462 * 10) / 10 
          : entry.weight
      };
    });
};

export const processGLP1ChartData = (data: GLP1Entry[]) => {
  if (!data.length) return [];

  return data
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => {
      const date = new Date(entry.date);
      return {
        ...entry,
        date: entry.date,
        displayDate: CHART_DATE_FORMATS.short(date),
        formattedDate: CHART_DATE_FORMATS.display(date),
        dose: entry.dose,
        halfLifeHours: entry.halfLifeHours
      };
    });
};

// Chart configuration generators
export const createWeightChartConfig = (data: WeightEntry[], unitSystem: 'metric' | 'imperial' = 'metric') => {
  return {
    data: processWeightChartData(data, unitSystem),
    xKey: 'displayDate',
    yKey: 'displayWeight',
    stroke: '#4ADEA8',
    strokeWidth: 2,
    dot: { fill: '#4ADEA8', r: 4 },
    activeDot: { r: 6 },
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
    unitLabel: unitSystem === 'imperial' ? 'Weight (lbs)' : 'Weight (kg)',
    referenceLineKey: 'weight',
    referenceLineColor: '#B19CD9'
  };
};

export const createGLP1ChartConfig = (data: GLP1Entry[]) => {
  return {
    data: processGLP1ChartData(data),
    xKey: 'displayDate',
    yKeys: ['dose', 'halfLifeHours'],
    fillOpacity: 0.3,
    stroke: ['#4ADEA8', '#B19CD9'],
    strokeWidth: 2,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
    unitLabel: 'Dose (mg) / Half Life (hours)'
  };
};

// Period filtering utilities
export type ChartPeriod = '1W' | '2W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export const PERIOD_CONFIGS = {
  '1W': { days: 7, label: '1 Week' },
  '2W': { days: 14, label: '2 Weeks' },
  '1M': { days: 30, label: '1 Month' },
  '3M': { days: 90, label: '3 Months' },
  '6M': { days: 180, label: '6 Months' },
  '1Y': { days: 365, label: '1 Year' },
  'ALL': { days: Infinity, label: 'All Time' }
} as const;

export const filterDataByPeriod = <T extends { date: string }>(
  data: T[], 
  period: ChartPeriod
): T[] => {
  if (period === 'ALL') return data;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - PERIOD_CONFIGS[period].days);
  
  return data.filter(entry => new Date(entry.date) >= cutoffDate);
};

// Custom tooltip formatter
export const createChartTooltip = (unitSystem: 'metric' | 'imperial' = 'metric') => {
  return (props: any) => {
    const { active, payload, label } = props;
    if (!active || !payload || !payload.length) return null;

    // Return object structure for Recharts tooltip
    return {
      active,
      payload,
      label,
      formatter: (value: any, name: any) => {
        const displayValue = typeof value === 'number' ? value.toFixed(1) : value;
        const unit = unitSystem === 'imperial' && name.toLowerCase().includes('weight') 
          ? ' lbs' 
          : unitSystem === 'metric' && name.toLowerCase().includes('weight') 
          ? ' kg' 
          : '';
        return [displayValue + unit, name];
      }
    };
  };
};

// Empty state message
export const getEmptyStateMessage = (dataType: 'weight' | 'glp1', period: ChartPeriod): string => {
  const periodLabel = PERIOD_CONFIGS[period].label.toLowerCase();
  
  switch (dataType) {
    case 'weight':
      return `No weight data found for the ${periodLabel}`;
    case 'glp1':
      return `No GLP-1 data found for the ${periodLabel}`;
    default:
      return `No data found for the ${periodLabel}`;
  }
};

// Date range utilities
export const getDateRange = (period: ChartPeriod): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();
  
  if (period !== 'ALL') {
    start.setDate(start.getDate() - PERIOD_CONFIGS[period].days);
  } else {
    start.setFullYear(start.getFullYear() - 1); // Default to 1 year ago for "ALL"
  }
  
  return { start, end };
};

// Chart accessibility helpers
export const generateChartAriaLabel = (
  chartType: 'weight' | 'glp1',
  dataPoints: number,
  period: ChartPeriod,
  unitSystem: 'metric' | 'imperial'
): string => {
  const periodLabel = PERIOD_CONFIGS[period].label.toLowerCase();
  const unitLabel = chartType === 'weight' 
    ? (unitSystem === 'imperial' ? 'pounds' : 'kilograms')
    : 'milligrams';
  
  return `${chartType === 'weight' ? 'Weight' : 'GLP-1'} chart showing ${dataPoints} data points over ${periodLabel} in ${unitLabel}`;
};

// Export everything as a hook for React usage
export const useChartUtils = () => {
  return {
    dateFormats: CHART_DATE_FORMATS,
    periodConfigs: PERIOD_CONFIGS,
    processWeightChartData,
    processGLP1ChartData,
    createWeightChartConfig,
    createGLP1ChartConfig,
    filterDataByPeriod,
    createChartTooltip,
    getEmptyStateMessage,
    getDateRange,
    generateChartAriaLabel
  };
};