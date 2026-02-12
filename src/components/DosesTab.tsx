import React, { useState, useMemo } from 'react';
import DosesChart from './DosesChart';
import DoseModal from './DoseModal';
import PeriodSelector from './PeriodSelector';
import { GLP1Entry } from '../types';
import { ChartPeriod } from '../hooks';
import { useThemeStyles } from '../contexts/ThemeContext';
import { calculateGLP1Concentration } from '../utils/calculations';

interface DosesTabProps {
  dosesEntries: GLP1Entry[];
  onAddDose: (dose: number, medication: string, date: string) => void;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (period: ChartPeriod) => void;
}

const DosesTab: React.FC<DosesTabProps> = ({ dosesEntries, onAddDose, chartPeriod, onChartPeriodChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { bigCard, bigCardText, smallCard, text } = useThemeStyles();

  const stats = useMemo(() => {
    if (dosesEntries.length === 0) {
      return { totalDoses: 0, currentDoses: [], totalCurrentDose: 0, nextDueDays: 0, nextDueDateStr: '', currentLevel: 0, timeActive: 0, thisMonth: 0 };
    }

    const sorted = [...dosesEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const oldest = [...dosesEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    
    const totalDoses = dosesEntries.length;
    
    const meds = Array.from(new Set(dosesEntries.map(e => e.medication)));
    const currentDoses: { med: string; dose: number }[] = [];
    meds.forEach(med => {
      const medDoses = sorted.filter(e => e.medication === med);
      if (medDoses.length > 0) {
        currentDoses.push({ med: med, dose: medDoses[0].dose });
      }
    });
    const totalCurrentDose = currentDoses.reduce((sum, d) => sum + d.dose, 0);
    
    const lastDoseDate = new Date(sorted[0]?.date);
    const today = new Date();
    const daysSinceLastDose = Math.floor((today.getTime() - lastDoseDate.getTime()) / (1000 * 60 * 60 * 24));
    const nextDueDays = Math.max(0, 7 - daysSinceLastDose);
    const nextDueDate = new Date(lastDoseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const getOrdinal = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const nextDueDateStr = `(${getOrdinal(nextDueDate.getDate())})`;
    
    const halfLife = sorted[0]?.halfLifeHours || 168;
    const currentLevel = calculateGLP1Concentration(
      sorted.map(e => ({ date: new Date(e.date), dose: e.dose })),
      halfLife,
      new Date()
    );
    
    const firstDoseDate = new Date(oldest.date);
    const timeActive = Math.floor((today.getTime() - firstDoseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const thisMonth = dosesEntries.filter(e => {
      const doseDate = new Date(e.date);
      return doseDate.getMonth() === today.getMonth() && doseDate.getFullYear() === today.getFullYear();
    }).length;

    return { totalDoses, currentDoses, totalCurrentDose, nextDueDays, nextDueDateStr, currentLevel, timeActive, thisMonth };
  }, [dosesEntries]);

  return (
    <div className="space-y-3">
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Doses</h1>
        
        {/* Stats and Chart Section */}
        <div className="space-y-3 mb-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 overflow-visible">
            <div className={smallCard}>
              <p className={text.label}>Total Doses</p>
              <p className={text.value}>{stats.totalDoses}</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Next Due</p>
              <p className={text.totalLossValue} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>{stats.nextDueDays}d</span>
                <span className={text.percentage}>{stats.nextDueDateStr}</span>
              </p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Current Dose</p>
              <p className={text.value}>{stats.totalCurrentDose.toFixed(2)}mg</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Current Level</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Time Active</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>This Month</p>
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
