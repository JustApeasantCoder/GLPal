import React, { useState } from 'react';
import WeightChart from './WeightChart';
import GLP1Chart from './GLP1Chart';
import PerformanceOverview from './PerformanceOverview';
import TDEEDisplay from './TDEEDisplay';
import { useWeightMetrics, useFilteredWeights, type ChartPeriod } from '../hooks';
import { WeightEntry, GLP1Entry, UserProfile } from '../types';
import { useThemeStyles } from '../contexts/ThemeContext';

interface DashboardProps {
  weights: WeightEntry[];
  glp1Entries: GLP1Entry[];
  profile: UserProfile;
  goalWeight?: number;
  onAddWeight: (weight: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  weights,
  glp1Entries,
  profile,
  goalWeight = 80,
  onAddWeight,
}) => {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('90days');
  const { smallCard, text, button } = useThemeStyles();

  // Use custom hooks for data processing
  const weightMetrics = useWeightMetrics(weights, profile, goalWeight);
  const filteredWeights = useFilteredWeights(weights, chartPeriod);

  return (
    <>
      {/* Unified Dashboard Card */}
      <div className="bg-white/80 dark:bg-black/30 backdrop-blur-lg rounded-2xl shadow-lg dark:shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-gray-200 dark:border-[#9C7BD3]/20">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#B19CD9] mb-4 dark:[text-shadow:0_0_20px_rgba(177,156,217,0.6)]">Dashboard</h1>
        
        {/* Metrics Section */}
        <div className="space-y-3 mb-6">
          {/* Row 1: Current, BMI, Total Loss */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className={smallCard}>
              <p className={text.label}>Current</p>
              <p className={text.value}>{weightMetrics.currentWeight.toFixed(1)} kg</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>BMI</p>
              <p className={text.value}>{weightMetrics.bmi.toFixed(1)}</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Total Loss</p>
              <p className={text.totalLossValue}>
                {weightMetrics.totalLoss.toFixed(1)} kg <span className={text.percentage}>({weightMetrics.totalLossPercentage.toFixed(1)}%)</span>
              </p>
            </div>
          </div>
          
          {/* Row 2: Weekly Avg, Monthly Avg, To Lose */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className={smallCard}>
              <p className={text.label}>Weekly Avg</p>
              <p className={text.value}>
                {weightMetrics.weeklyAverageLoss > 0 ? '-' : ''}{weightMetrics.weeklyAverageLoss.toFixed(1)} kg
              </p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Monthly Avg</p>
              <p className={text.value}>
                {weightMetrics.monthlyAverageLoss > 0 ? '-' : ''}{weightMetrics.monthlyAverageLoss.toFixed(1)} kg
              </p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>To Lose</p>
              <p className={text.value}>
                {(weightMetrics.currentWeight - goalWeight).toFixed(1)} kg
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          {/* Weight Trends */}
          <div>
            <div className="flex justify-center mb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setChartPeriod('week')}
                  className={button(chartPeriod === 'week')}
                >
                  Week
                </button>
                <button
                  onClick={() => setChartPeriod('month')}
                  className={button(chartPeriod === 'month')}
                >
                  Month
                </button>
                <button
                  onClick={() => setChartPeriod('90days')}
                  className={button(chartPeriod === '90days')}
                >
                  90 days
                </button>
                <button
                  onClick={() => setChartPeriod('all')}
                  className={button(chartPeriod === 'all')}
                >
                  All Time
                </button>
              </div>
            </div>
            <div className="h-48 sm:h-56">
              <WeightChart data={filteredWeights} goalWeight={goalWeight} />
            </div>
          </div>

          {/* GLP-1 Status */}
          <div>
            <div className="h-32 sm:h-40">
              <GLP1Chart data={glp1Entries} />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <PerformanceOverview 
        weights={weights}
        totalLoss={weightMetrics.totalLoss}
        startWeight={weightMetrics.startWeight}
        goalWeight={weightMetrics.goalWeight}
      />

      {/* Metabolic Profile */}
      <div className="bg-white/80 dark:bg-black/30 backdrop-blur-lg rounded-2xl shadow-lg dark:shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-gray-200 dark:border-[#9C7BD3]/20">
        <TDEEDisplay profile={profile} currentWeight={weightMetrics.currentWeight} />
      </div>
    </>
  );
};

export default Dashboard;