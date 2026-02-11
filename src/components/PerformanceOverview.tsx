import React from 'react';
import { WeightEntry } from '../types';

interface PerformanceOverviewProps {
  weights: WeightEntry[];
  totalLoss: number;
  startWeight: number;
  goalWeight: number;
}

const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({
  weights,
  totalLoss,
  startWeight,
  goalWeight,
}) => {
  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
      <h4 className="font-medium text-[#B19CD9] mb-3 [text-shadow:0_0_10px_rgba(177,156,217,0.4)]">Performance Overview</h4>
      
      {/* Performance Overview Row */}
      <div className="space-y-3 mb-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
            <p className="text-xs text-[#B19CD9] font-medium">Progress Rate</p>
            <div className="text-left">
              <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
                {((totalLoss / (startWeight - goalWeight)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
            <p className="text-xs text-[#B19CD9] font-medium">Best Week</p>
            <div className="text-left">
              <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
                -{Math.max(...weights.map((entry, i) => {
                  if (i === 0) return 0;
                  const weekStart = Math.floor(i / 7);
                  
                  // Find the start of this week
                  let weekStartIndex = 0;
                  for (let j = 0; j < i; j++) {
                    if (Math.floor(j / 7) === weekStart) {
                      weekStartIndex = j;
                      break;
                    }
                  }
                  
                  if (weekStartIndex === 0) return 0;
                  
                  const weekEndIndex = Math.min(weekStartIndex + 6, weights.length - 1);
                  const weekWeights = weights.slice(weekStartIndex, weekEndIndex + 1);
                  
                  if (weekWeights.length < 2) return 0;
                  
                  const weekStartWeight = weekWeights[0].weight;
                  const weekEndWeight = weekWeights[weekWeights.length - 1].weight;
                  return weekStartWeight - weekEndWeight;
                })).toFixed(1)} kg
              </p>
            </div>
          </div>
          <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
            <p className="text-xs text-[#B19CD9] font-medium">Time Active</p>
            <div className="text-left">
              <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
                {weights.length} Days
              </p>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
            <p className="text-xs text-[#B19CD9] font-medium">Start Weight</p>
            <div className="text-left">
              <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">{startWeight.toFixed(1)} kg</p>
            </div>
          </div>
          <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
            <p className="text-xs text-[#B19CD9] font-medium">Best Month</p>
            <div className="text-left">
              <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
                -{Math.max(...weights.map((entry, i) => {
                  if (i === 0) return 0;
                  const currentMonth = new Date(entry.date).getMonth();
                  const prevMonth = new Date(weights[i - 1].date).getMonth();
                  return prevMonth === currentMonth ? weights[i - 1].weight - entry.weight : 0;
                })).toFixed(1)} kg
              </p>
            </div>
          </div>
          <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
            <p className="text-xs text-[#B19CD9] font-medium">Total Loss</p>
            <div className="text-left">
              <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">{totalLoss.toFixed(1)} kg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceOverview;