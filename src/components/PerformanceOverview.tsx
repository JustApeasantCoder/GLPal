import React from 'react';
import { WeightAnalytics } from '../services';
import { WeightEntry } from '../types';
import { useThemeStyles } from '../contexts/ThemeContext';

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
  const { smallCard, text } = useThemeStyles();
  return (
    <div className="bg-card-bg backdrop-blur-lg rounded-2xl shadow-theme p-4 border border-card-border">
      <h4 className="font-medium text-text-primary mb-3" style={{ textShadow: '0 0 10px var(--accent-purple-light)' }}>Performance Overview</h4>
      
      {/* Performance Overview Row */}
      <div className="space-y-3 mb-3">
        <div className="grid grid-cols-3 gap-3">
          <div className={smallCard}>
            <p className={text.label}>Progress Rate</p>
            <div className="text-left">
              <p className={text.value}>
                {((totalLoss / (startWeight - goalWeight)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className={smallCard}>
            <p className={text.label}>Best Week</p>
<div className="text-left">
            <p className={text.value}>
              -{WeightAnalytics.calculateBestWeek(weights).toFixed(1)} kg
            </p>
          </div>
          </div>
          <div className={smallCard}>
            <p className={text.label}>Time Active</p>
            <div className="text-left">
              <p className={text.value}>
                {weights.length} Days
              </p>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className={smallCard}>
            <p className={text.label}>Start Weight</p>
            <div className="text-left">
              <p className={text.value}>{startWeight.toFixed(1)} kg</p>
            </div>
          </div>
          <div className={smallCard}>
            <p className={text.label}>Best Month</p>
            <div className="text-left">
              <p className={text.value}>
                -{WeightAnalytics.calculateBestMonth(weights).toFixed(1)} kg
              </p>
            </div>
          </div>
          <div className={smallCard}>
            <p className={text.label}>Total Loss</p>
            <div className="text-left">
              <p className={text.value}>{totalLoss.toFixed(1)} kg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceOverview;