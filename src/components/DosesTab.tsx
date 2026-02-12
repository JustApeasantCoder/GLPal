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
  const { bigCard, bigCardText } = useThemeStyles();

  return (
    <div className="space-y-3">
      <div className={bigCard}>
        <PeriodSelector value={chartPeriod} onChange={onChartPeriodChange} />

        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Doses</h1>
        <div className="h-64 sm:h-80">
          <DosesChart data={dosesEntries} period={chartPeriod} />
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
