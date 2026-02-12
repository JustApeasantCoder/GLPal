import React, { useState } from 'react';
import WeightChart from './WeightChart';
import WeightInput from './WeightInput';
import { useWeightMetrics, useFilteredWeights, type ChartPeriod } from '../hooks';
import { WeightEntry, UserProfile } from '../types';
import { useThemeStyles } from '../contexts/ThemeContext';
import { formatWeight } from '../utils/unitConversion';

interface WeightTabProps {
  weights: WeightEntry[];
  profile: UserProfile;
  onAddWeight: (weight: number) => void;
  onGoalUpdate?: (goalWeight: number) => void;
}

const WeightTab: React.FC<WeightTabProps> = ({
  weights,
  profile,
  onAddWeight,
  onGoalUpdate,
}) => {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('90days');

  // Use custom hooks for data processing
  const weightMetrics = useWeightMetrics(weights, profile, profile.goalWeight || 80);
  const filteredWeights = useFilteredWeights(weights, chartPeriod);
  const { bigCard, bigCardText, smallCard, text } = useThemeStyles();
  const unitSystem = profile.unitSystem || 'metric';

  return (
    <div className={bigCard}>
      <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Weight Tracking</h1>
      
      {/* Stats Row - Current & Goal */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={smallCard}>
          <p className={text.label}>Current</p>
          <p className={text.value}>{formatWeight(weightMetrics.currentWeight, unitSystem)}</p>
        </div>
            <div className={smallCard}>
              <p className={text.label}>Goal</p>
              <p className={text.value}>{formatWeight(profile.goalWeight || 80, unitSystem)}</p>
            </div>
      </div>

      {/* Weight Input Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-3" style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Log Weight</h3>
        <WeightInput onAddWeight={onAddWeight} unitSystem={unitSystem} />
      </div>

      {/* Chart Section */}
      <div>
        <div className="flex justify-center mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setChartPeriod('week')}
              className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                chartPeriod === 'week'
                  ? 'bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white shadow-button'
                  : 'bg-white/80 dark:bg-accent-purple-light/10 text-gray-700 dark:text-accent-purple-light border border-gray-200 dark:border-accent-purple-light/30 hover:bg-gray-100 dark:hover:bg-accent-purple-light/20 hover:shadow-card-md'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setChartPeriod('month')}
              className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                chartPeriod === 'month'
                  ? 'bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white shadow-button'
                  : 'bg-white/80 dark:bg-accent-purple-light/10 text-gray-700 dark:text-accent-purple-light border border-gray-200 dark:border-accent-purple-light/30 hover:bg-gray-100 dark:hover:bg-accent-purple-light/20 hover:shadow-card-md'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setChartPeriod('90days')}
              className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                chartPeriod === '90days'
                  ? 'bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white shadow-button'
                  : 'bg-white/80 dark:bg-accent-purple-light/10 text-gray-700 dark:text-accent-purple-light border border-gray-200 dark:border-accent-purple-light/30 hover:bg-gray-100 dark:hover:bg-accent-purple-light/20 hover:shadow-card-md'
              }`}
            >
              90 days
            </button>
            <button
              onClick={() => setChartPeriod('all')}
              className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                chartPeriod === 'all'
                  ? 'bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white shadow-button'
                  : 'bg-white/80 dark:bg-accent-purple-light/10 text-gray-700 dark:text-accent-purple-light border border-gray-200 dark:border-accent-purple-light/30 hover:bg-gray-100 dark:hover:bg-accent-purple-light/20 hover:shadow-card-md'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
        <div className="h-64 sm:h-80">
          <WeightChart data={filteredWeights} goalWeight={profile.goalWeight || 80} unitSystem={unitSystem} />
        </div>
      </div>
    </div>
  );
};

export default WeightTab;