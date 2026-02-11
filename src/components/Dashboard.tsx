import React, { useState } from 'react';
import WeightChart from './WeightChart';
import GLP1Chart from './GLP1Chart';
import PerformanceOverview from './PerformanceOverview';
import TDEEDisplay from './TDEEDisplay';
import { useWeightMetrics, useFilteredWeights, type ChartPeriod } from '../hooks';
import { WeightEntry, GLP1Entry, UserProfile } from '../types';

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

  // Use custom hooks for data processing
  const weightMetrics = useWeightMetrics(weights, profile, goalWeight);
  const filteredWeights = useFilteredWeights(weights, chartPeriod);

  return (
    <>
      {/* Unified Dashboard Card */}
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
        <h1 className="text-2xl font-bold text-[#B19CD9] [text-shadow:0_0_20px_rgba(177,156,217,0.6)] mb-4">Dashboard</h1>
        
        {/* Metrics Section */}
        <div className="space-y-3 mb-6">
          {/* Row 1: Current, BMI, Total Loss */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
              <p className="text-xs text-[#B19CD9] font-medium">Current</p>
              <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">{weightMetrics.currentWeight.toFixed(1)} kg</p>
            </div>
            <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
              <p className="text-xs text-[#B19CD9] font-medium">BMI</p>
              <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">{weightMetrics.bmi.toFixed(1)}</p>
            </div>
            <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm px-2 py-1 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
              <p className="text-xs text-[#B19CD9] font-medium">Total Loss</p>
              <p className="text-base font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)] leading-tight">
                {weightMetrics.totalLoss.toFixed(1)} kg <span className="text-xs text-[#B19CD9]/80 -mt-1 inline-block">({weightMetrics.totalLossPercentage.toFixed(1)}%)</span>
              </p>
            </div>
          </div>
          
          {/* Row 2: Weekly Avg, Monthly Avg, To Lose */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
              <p className="text-xs text-[#B19CD9] font-medium">Weekly Avg</p>
              <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
                {weightMetrics.weeklyAverageLoss > 0 ? '-' : ''}{weightMetrics.weeklyAverageLoss.toFixed(1)} kg
              </p>
            </div>
            <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
              <p className="text-xs text-[#B19CD9] font-medium">Monthly Avg</p>
              <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
                {weightMetrics.monthlyAverageLoss > 0 ? '-' : ''}{weightMetrics.monthlyAverageLoss.toFixed(1)} kg
              </p>
            </div>
            <div className="h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-3 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between">
              <p className="text-xs text-[#B19CD9] font-medium">To Lose</p>
              <p className="text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]">
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
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
        <TDEEDisplay profile={profile} currentWeight={weightMetrics.currentWeight} />
      </div>
    </>
  );
};

export default Dashboard;