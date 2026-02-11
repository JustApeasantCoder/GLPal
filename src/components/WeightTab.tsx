import React, { useState } from 'react';
import WeightChart from './WeightChart';
import WeightInput from './WeightInput';
import { useWeightMetrics, useFilteredWeights, type ChartPeriod } from '../hooks';
import { WeightEntry, UserProfile } from '../types';

interface WeightTabProps {
  weights: WeightEntry[];
  profile: UserProfile;
  goalWeight?: number;
  onAddWeight: (weight: number) => void;
}

const WeightTab: React.FC<WeightTabProps> = ({
  weights,
  profile,
  goalWeight = 80,
  onAddWeight,
}) => {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('90days');

  // Use custom hooks for data processing
  const weightMetrics = useWeightMetrics(weights, profile, goalWeight);
  const filteredWeights = useFilteredWeights(weights, chartPeriod);

  return (
    <>
      <header className="bg-white/80 dark:bg-black/30 backdrop-blur-lg rounded-2xl shadow-lg dark:shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-gray-200 dark:border-[#9C7BD3]/20">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#B19CD9] mb-3 dark:[text-shadow:0_0_20px_rgba(177,156,217,0.6)]">Weight Tracking</h1>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/70 dark:from-[#B19CD9]/20 dark:to-[#9C7BD3]/20 dark:bg-gradient-to-br backdrop-blur-sm p-3 rounded-xl border border-gray-200 dark:border-[#B19CD9]/30 shadow-sm dark:shadow-[0_0_20px_rgba(177,156,217,0.3)]">
            <p className="text-xs text-gray-600 dark:text-[#B19CD9] font-medium">Current</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white dark:[text-shadow:0_0_10px_rgba(177,156,217,0.5)]">{weightMetrics.currentWeight.toFixed(1)} kg</p>
          </div>
          <div className="bg-white/70 dark:from-[#5B4B8A]/20 dark:to-[#9C7BD3]/20 dark:bg-gradient-to-br backdrop-blur-sm p-3 rounded-xl border border-gray-200 dark:border-[#5B4B8A]/30 shadow-sm dark:shadow-[0_0_20px_rgba(91,75,138,0.3)]">
            <p className="text-xs text-gray-600 dark:text-[#9C7BD3] font-medium">Goal</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white dark:[text-shadow:0_0_10px_rgba(156,123,211,0.5)]">{goalWeight} kg</p>
          </div>
        </div>
      </header>

      <div className="bg-white/80 dark:bg-black/30 backdrop-blur-lg rounded-2xl shadow-lg dark:shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-gray-200 dark:border-[#9C7BD3]/20">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-[#B19CD9] mb-3 dark:[text-shadow:0_0_10px_rgba(177,156,217,0.4)]">Add Today's Weight</h3>
        <WeightInput onAddWeight={onAddWeight} />
      </div>

      <div className="bg-white/80 dark:bg-black/30 backdrop-blur-lg rounded-2xl shadow-lg dark:shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-gray-200 dark:border-[#9C7BD3]/20">
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
          <WeightChart data={filteredWeights} goalWeight={goalWeight} />
        </div>
      </div>
    </>
  );
};

export default WeightTab;