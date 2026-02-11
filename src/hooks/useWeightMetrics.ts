import { useMemo } from 'react';
import { WeightAnalytics, WeightMetrics } from '../services';
import { WeightEntry, UserProfile } from '../types';

export const useWeightMetrics = (weights: WeightEntry[], profile: UserProfile, goalWeight: number = 80): WeightMetrics => {
  return useMemo(() => {
    return WeightAnalytics.calculateMetrics(weights, profile, goalWeight);
  }, [weights, profile, goalWeight]);
};