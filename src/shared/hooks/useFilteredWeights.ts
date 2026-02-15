import { useMemo } from 'react';
import { WeightEntry } from '../../types';

export type ChartPeriod = 'week' | 'month' | '90days' | 'all';

export const useFilteredWeights = (weights: WeightEntry[], period: ChartPeriod): WeightEntry[] => {
  return useMemo(() => {
    if (period === 'all') return weights;
    
    const now = new Date();
    const filterDate = new Date();
    
    switch (period) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        filterDate.setDate(now.getDate() - 90);
        break;
      default:
        return weights;
    }
    
    const filterDateStr = filterDate.toISOString().split('T')[0];
    return weights.filter(entry => entry.date >= filterDateStr);
  }, [weights, period]);
};