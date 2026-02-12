import React, { useState } from 'react';
import DosesChart from './DosesChart';
import DoseModal from './DoseModal';
import PeriodSelector from './PeriodSelector';
import { GLP1Entry } from '../types';
import { ChartPeriod } from '../hooks';
import { useThemeStyles } from '../contexts/ThemeContext';

interface DosesTabProps {
  dosesEntries: GLP1Entry[];
  onAddDose: (dose: number, medication: string, date: string) => void;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (period: ChartPeriod) => void;
}

const DosesTab: React.FC<DosesTabProps> = ({ dosesEntries, onAddDose, chartPeriod, onChartPeriodChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { bigCard, bigCardText, smallCard, text } = useThemeStyles();

  return (
    <div className="space-y-3">
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Doses</h1>
        
        {/* Stats and Chart Section */}
        <div className="space-y-3">
          {/* Empty Stats Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
            <div className={smallCard}>
              <p className={text.label}>Total Doses</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Current Streak</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Avg Dose</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Peak Level</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Time Active</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Total Amount</p>
            </div>
          </div>
          
          <div>
            <PeriodSelector value={chartPeriod} onChange={onChartPeriodChange} />
            <div className="h-64 sm:h-80">
              <DosesChart data={dosesEntries} period={chartPeriod} />
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-3 bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:from-accent-purple-dark hover:to-accent-purple-medium transition-all duration-300 shadow-theme hover:shadow-theme-lg"
        >
          Log Dose
        </button>
      </div>

      <DoseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddDose={onAddDose}
      />
    </div>
  );
};

export default DosesTab;
