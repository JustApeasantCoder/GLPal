import React, { useMemo, useState, useCallback } from 'react';
import WeightChart from '../weight/WeightChart';
import MedicationChart from '../medication/components/MedicationChart';
import PerformanceOverview from './components/PerformanceOverview';
import TDEEDisplay from './components/TDEEDisplay';
import StorageCard from './components/StorageCard';
import QuickLogModal from './components/QuickLogModal';
import BMIInfoTooltip from './components/BMIInfoTooltip';
import PeriodSelector from '../../shared/components/PeriodSelector';
import { useWeightMetrics, type ChartPeriod } from '../../shared/hooks';
import { WeightEntry, GLP1Entry, UserProfile, MedicationStorage, DailyLogEntry } from '../../types';
import { useThemeStyles } from '../../contexts/ThemeContext';
import { formatWeight, convertWeightFromKg } from '../../shared/utils/unitConversion';
import { addWeightEntry } from '../../shared/utils/database';

interface DashboardProps {
  weights: WeightEntry[];
  dosesEntries: GLP1Entry[];
  profile: UserProfile;
  goalWeight?: number;
  onAddWeight: (weight: number) => void;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (period: ChartPeriod) => void;
  useWheelForNumbers?: boolean;
  useWheelForDate?: boolean;
  medicationStorage: MedicationStorage[];
  onAddMedicationStorage: (item: MedicationStorage) => void;
  onUpdateMedicationStorage: (item: MedicationStorage) => void;
  onDeleteMedicationStorage: (id: string) => void;
  activeModal?: string | null;
  onOpenModal?: (modal: string) => void;
  onCloseModal?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  weights,
  dosesEntries,
  profile,
  goalWeight,
  onAddWeight,
  chartPeriod,
  onChartPeriodChange,
  useWheelForNumbers = true,
  useWheelForDate = false,
  medicationStorage,
  onAddMedicationStorage,
  onUpdateMedicationStorage,
  onDeleteMedicationStorage,
  activeModal,
  onOpenModal,
  onCloseModal,
}) => {
  const { bigCard, bigCardText, smallCard, text } = useThemeStyles();
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  // Use custom hooks for data processing
  const actualGoalWeight = goalWeight || profile.goalWeight || 80;
  const weightMetrics = useWeightMetrics(weights, profile, actualGoalWeight);
  const unitSystem = profile.unitSystem || 'metric';

  const lastWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
  const lastWeightDisplay = lastWeight ? convertWeightFromKg(lastWeight, unitSystem) : null;

  const generatedEntries = useMemo(
    () => dosesEntries,
    [dosesEntries]
  );

  const handleQuickLogSave = useCallback(async (entry: DailyLogEntry, weightKg?: number) => {
    if (weightKg) {
      const weightEntry: WeightEntry = {
        date: entry.date,
        weight: weightKg,
        notes: entry.notes,
        macros: entry.macros,
      };
      await addWeightEntry(weightEntry);
      onAddWeight(weightKg);
    }
  }, [onAddWeight]);

  return (
    <>
      {/* Unified Dashboard Card */}
      <div className={bigCard}>
        <h1 className={bigCardText.title} >Dashboard</h1>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        {/* Metrics Section */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 overflow-visible">
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

        <div className="border-t border-[#B19CD9]/20 my-3"></div>

        {/* Charts Section */}
        <div className="space-y-6">
{/* Weight Trends */}
          <div>
            <PeriodSelector value={chartPeriod} onChange={onChartPeriodChange} />
            <div className="h-80 sm:h-96 lg:h-112">
              <WeightChart data={weights} goalWeight={actualGoalWeight} unitSystem={unitSystem} period={chartPeriod} medicationData={dosesEntries} />
            </div>
          </div>

          {/* Medication Status */}
          <div>
            <div className="h-80 sm:h-96 lg:h-112">
              <MedicationChart data={generatedEntries} period={chartPeriod} />
            </div>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-3"></div>

{/* Quick Log Button */}
          <div className="mb-6">
            <button
              onClick={() => setIsQuickLogOpen(true)}
              className="w-full bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white py-3 px-4 rounded-xl font-medium hover:shadow-[0_0_20px_rgba(74,222,168,0.5)] transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Quick Log
            </button>
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

      {/* Medication Storage */}
      <StorageCard
        medicationStorage={medicationStorage}
        glp1Entries={dosesEntries}
        onAddStorage={onAddMedicationStorage}
        onUpdateStorage={onUpdateMedicationStorage}
        onDeleteStorage={onDeleteMedicationStorage}
        unitSystem={unitSystem}
        isModalOpen={activeModal === 'storage'}
        onOpenModal={() => onOpenModal?.('storage')}
        onCloseModal={onCloseModal}
        useWheelForDate={useWheelForDate}
      />

      {/* Quick Log Modal */}
      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onSave={handleQuickLogSave}
        profile={profile}
      />
    </>
  );
};

export default Dashboard;