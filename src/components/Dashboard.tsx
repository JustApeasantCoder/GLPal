import React, { useState } from 'react';
import WeightChart from './WeightChart';
import DosesChart from './DosesChart';
import PerformanceOverview from './PerformanceOverview';
import TDEEDisplay from './TDEEDisplay';
import WeightInput from './WeightInput';
import BMIInfoTooltip from './BMIInfoTooltip';
import { useWeightMetrics, useFilteredWeights, type ChartPeriod } from '../hooks';
import { WeightEntry, GLP1Entry, UserProfile } from '../types';
import { useThemeStyles } from '../contexts/ThemeContext';
import { formatWeight } from '../utils/unitConversion';

interface DashboardProps {
  weights: WeightEntry[];
  dosesEntries: GLP1Entry[];
  profile: UserProfile;
  goalWeight?: number;
  onAddWeight: (weight: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  weights,
  dosesEntries,
  profile,
  goalWeight,
  onAddWeight,
}) => {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('90days');
  const { bigCard, bigCardText, smallCard, text, button } = useThemeStyles();

  // Use custom hooks for data processing
  const actualGoalWeight = goalWeight || profile.goalWeight || 80;
  const weightMetrics = useWeightMetrics(weights, profile, actualGoalWeight);
  const filteredWeights = useFilteredWeights(weights, chartPeriod);
  const unitSystem = profile.unitSystem || 'metric';

  return (
    <>
      {/* Unified Dashboard Card */}
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Dashboard</h1>
        
        {/* Metrics Section */}
        <div className="space-y-3 mb-6">
{/* Row 1: Current, BMI, Total Loss */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 overflow-visible">
            <div className={smallCard}>
              <p className={text.label}>Current</p>
              <p className={text.value}>{formatWeight(weightMetrics.currentWeight, unitSystem)}</p>
            </div>
            <div className={smallCard}>
              <div className="flex justify-between items-center mb-1">
                <p className={text.label}>BMI</p>
                <BMIInfoTooltip />
              </div>
              <p className={text.totalLossValue} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                <span style={{display: 'inline-block', whiteSpace: 'nowrap'}}>
                  {weightMetrics.bmi.toFixed(1)}
                </span>
                <span className={`${text.bmiCategory} ${weightMetrics.bmiCategory.color}`}>
                  ({weightMetrics.bmiCategory.category})
                </span>
              </p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Total Loss</p>
              <p className={text.totalLossValue} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                <span style={{display: 'inline-block', whiteSpace: 'nowrap'}}>
                  {formatWeight(weightMetrics.totalLoss, unitSystem)}
                </span>
                <span className={text.percentage}>
                  ({weightMetrics.totalLossPercentage.toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>
          
          {/* Row 2: Weekly Avg, Monthly Avg, To Lose */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className={smallCard}>
              <p className={text.label}>Weekly Avg</p>
              <p className={text.value}>
                {weightMetrics.weeklyAverageLoss > 0 ? '-' : ''}{formatWeight(Math.abs(weightMetrics.weeklyAverageLoss), unitSystem)}
              </p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Monthly Avg</p>
              <p className={text.value}>
                {weightMetrics.monthlyAverageLoss > 0 ? '-' : ''}{formatWeight(Math.abs(weightMetrics.monthlyAverageLoss), unitSystem)}
              </p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>To Lose</p>
              <p className={text.value}>
                {formatWeight(weightMetrics.currentWeight - actualGoalWeight, unitSystem)}
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
              <WeightChart data={filteredWeights} goalWeight={actualGoalWeight} unitSystem={unitSystem} />
            </div>
          </div>

          {/* GLP-1 Status */}
          <div>
            <div className="h-32 sm:h-40">
              <DosesChart data={dosesEntries} />
            </div>
          </div>

          {/* Weight Input Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3" style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Log Weight</h3>
            <WeightInput onAddWeight={onAddWeight} unitSystem={unitSystem} />
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <PerformanceOverview 
        weights={weights}
        totalLoss={weightMetrics.totalLoss}
        startWeight={weightMetrics.startWeight}
        goalWeight={actualGoalWeight}
        profile={profile}
      />

      {/* Metabolic Profile */}
      <div className={bigCard}>
        <TDEEDisplay profile={profile} currentWeight={weightMetrics.currentWeight} />
      </div>
    </>
  );
};

export default Dashboard;