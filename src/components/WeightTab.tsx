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
      <header className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
        <h1 className="text-2xl font-bold text-[#B19CD9] [text-shadow:0_0_20px_rgba(177,156,217,0.6)] mb-3">Weight Tracking</h1>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_20px_rgba(177,156,217,0.3)]">
            <p className="text-xs text-[#B19CD9] font-medium">Current</p>
            <p className="text-lg font-bold text-white [text-shadow:0_0_10px_rgba(177,156,217,0.5)]">{weightMetrics.currentWeight.toFixed(1)} kg</p>
          </div>
          <div className="bg-gradient-to-br from-[#5B4B8A]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#5B4B8A]/30 shadow-[0_0_20px_rgba(91,75,138,0.3)]">
            <p className="text-xs text-[#9C7BD3] font-medium">Goal</p>
            <p className="text-lg font-bold text-white [text-shadow:0_0_10px_rgba(156,123,211,0.5)]">{goalWeight} kg</p>
          </div>
        </div>
      </header>

      <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
        <h3 className="text-sm font-semibold text-[#B19CD9] mb-3 [text-shadow:0_0_10px_rgba(177,156,217,0.4)]">Add Today's Weight</h3>
        <WeightInput onAddWeight={onAddWeight} />
      </div>

      <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
        <div className="flex justify-center mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setChartPeriod('week')}
              className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                chartPeriod === 'week'
                  ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                  : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setChartPeriod('month')}
              className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                chartPeriod === 'month'
                  ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                  : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setChartPeriod('90days')}
              className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                chartPeriod === '90days'
                  ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                  : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
              }`}
            >
              90 days
            </button>
            <button
              onClick={() => setChartPeriod('all')}
              className={`w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                chartPeriod === 'all'
                  ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                  : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
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