import React, { useState } from 'react';
import WeightChart from '../weight/WeightChart';
import MedicationChart from '../medication/components/MedicationChart';
import PerformanceOverview from './components/PerformanceOverview';
import TDEEDisplay from './components/TDEEDisplay';
import WeightInput from '../weight/components/WeightInput';
import BMIInfoTooltip from './components/BMIInfoTooltip';
import PeriodSelector from '../../shared/components/PeriodSelector';
import { useWeightMetrics, type ChartPeriod } from '../../shared/hooks';
import { WeightEntry, GLP1Entry, UserProfile } from '../../types';
import { useThemeStyles } from '../../contexts/ThemeContext';
import { formatWeight, convertWeightFromKg } from '../../shared/utils/unitConversion';

interface DashboardProps {
  weights: WeightEntry[];
  dosesEntries: GLP1Entry[];
  profile: UserProfile;
  goalWeight?: number;
  onAddWeight: (weight: number) => void;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (period: ChartPeriod) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  weights,
  dosesEntries,
  profile,
  goalWeight,
  onAddWeight,
  chartPeriod,
  onChartPeriodChange,
}) => {
  const { bigCard, bigCardText, smallCard, text } = useThemeStyles();

  // Use custom hooks for data processing
  const actualGoalWeight = goalWeight || profile.goalWeight || 80;
  const weightMetrics = useWeightMetrics(weights, profile, actualGoalWeight);
  const unitSystem = profile.unitSystem || 'metric';

  const lastWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
  const lastWeightDisplay = lastWeight ? convertWeightFromKg(lastWeight, unitSystem) : null;

  return (
    <>
      {/* Unified Dashboard Card */}
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Dashboard</h1>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        {/* Metrics Section */}
        <div className="space-y-3 mb-3">
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

        <div className="border-t border-[#B19CD9]/20 my-3"></div>

        {/* Charts Section */}
        <div className="space-y-6">
{/* Weight Trends */}
          <div>
            <PeriodSelector value={chartPeriod} onChange={onChartPeriodChange} />
            <div className="h-64 sm:h-72">
              <WeightChart data={weights} goalWeight={actualGoalWeight} unitSystem={unitSystem} period={chartPeriod} medicationData={dosesEntries} />
            </div>
          </div>

          {/* Medication Status */}
          <div>
            <div className="h-64 sm:h-72">
              <MedicationChart data={dosesEntries} period={chartPeriod} />
            </div>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-3"></div>

{/* Weight Input Section */}
          <div className="mb-6">
            <WeightInput onAddWeight={onAddWeight} unitSystem={unitSystem} lastWeight={lastWeightDisplay} />
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