import React from 'react';
import { WeightAnalytics } from '../services';
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
    <div className="bg-card-bg backdrop-blur-lg rounded-2xl shadow-theme p-4 border border-card-border">
      <h4 className="font-medium text-text-primary mb-3" style={{ textShadow: '0 0 10px var(--accent-purple-light)' }}>Performance Overview</h4>
      
      {/* Performance Overview Row */}
      <div className="space-y-3 mb-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 sm:h-18 bg-gradient-to-br from-accent-purple-light/20 to-accent-purple-medium/20 backdrop-blur-sm p-3 rounded-xl border border-accent-purple-light/30 shadow-theme flex flex-col justify-between">
            <p className="text-xs text-accent-purple-light font-medium">Progress Rate</p>
            <div className="text-left">
              <p className="text-lg font-bold text-text-secondary" style={{ textShadow: '0 0 3px var(--accent-purple-light)' }}>
                {((totalLoss / (startWeight - goalWeight)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="h-16 sm:h-18 bg-gradient-to-br from-accent-purple-light/20 to-accent-purple-medium/20 backdrop-blur-sm p-3 rounded-xl border border-accent-purple-light/30 shadow-theme flex flex-col justify-between">
            <p className="text-xs text-accent-purple-light font-medium">Best Week</p>
<div className="text-left">
            <p className="text-lg font-bold text-text-secondary" style={{ textShadow: '0 0 3px var(--accent-purple-light)' }}>
              -{WeightAnalytics.calculateBestWeek(weights).toFixed(1)} kg
            </p>
          </div>
          </div>
          <div className="h-16 sm:h-18 bg-gradient-to-br from-accent-purple-light/20 to-accent-purple-medium/20 backdrop-blur-sm p-3 rounded-xl border border-accent-purple-light/30 shadow-theme flex flex-col justify-between">
            <p className="text-xs text-accent-purple-light font-medium">Time Active</p>
            <div className="text-left">
              <p className="text-lg font-bold text-text-secondary" style={{ textShadow: '0 0 3px var(--accent-purple-light)' }}>
                {weights.length} Days
              </p>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="h-16 sm:h-18 bg-gradient-to-br from-accent-purple-light/20 to-accent-purple-medium/20 backdrop-blur-sm p-3 rounded-xl border border-accent-purple-light/30 shadow-theme flex flex-col justify-between">
            <p className="text-xs text-accent-purple-light font-medium">Start Weight</p>
            <div className="text-left">
              <p className="text-lg font-bold text-text-secondary" style={{ textShadow: '0 0 3px var(--accent-purple-light)' }}>{startWeight.toFixed(1)} kg</p>
            </div>
          </div>
          <div className="h-16 sm:h-18 bg-gradient-to-br from-accent-purple-light/20 to-accent-purple-medium/20 backdrop-blur-sm p-3 rounded-xl border border-accent-purple-light/30 shadow-theme flex flex-col justify-between">
            <p className="text-xs text-accent-purple-light font-medium">Best Month</p>
            <div className="text-left">
              <p className="text-lg font-bold text-text-secondary" style={{ textShadow: '0 0 3px var(--accent-purple-light)' }}>
                -{WeightAnalytics.calculateBestMonth(weights).toFixed(1)} kg
              </p>
            </div>
          </div>
          <div className="h-16 sm:h-18 bg-gradient-to-br from-accent-purple-light/20 to-accent-purple-medium/20 backdrop-blur-sm p-3 rounded-xl border border-accent-purple-light/30 shadow-theme flex flex-col justify-between">
            <p className="text-xs text-accent-purple-light font-medium">Total Loss</p>
            <div className="text-left">
              <p className="text-lg font-bold text-text-secondary" style={{ textShadow: '0 0 3px var(--accent-purple-light)' }}>{totalLoss.toFixed(1)} kg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceOverview;