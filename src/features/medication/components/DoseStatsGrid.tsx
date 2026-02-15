import React from 'react';
import { DoseStats } from '../hooks/useDoseStats';
import { useThemeStyles } from '../../../contexts/ThemeContext';

interface DoseStatsGridProps {
  stats: DoseStats;
}

const DoseStatsGrid: React.FC<DoseStatsGridProps> = ({ stats }) => {
  const { smallCard, text } = useThemeStyles();

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 overflow-visible">
      <div className={smallCard}>
        <p className={text.label}>Total Doses</p>
        <p className={text.value}>{stats.totalDoses}</p>
      </div>
      <div className={smallCard}>
        <p className={text.label}>Next Due</p>
        <p className={text.totalLossValue} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>{stats.nextDueDays > 0 ? `${stats.nextDueDays} Day${stats.nextDueDays > 1 ? 's' : ''}` : 'Today'}</span>
          <span className={text.percentage}>{stats.nextDueDateStr}</span>
        </p>
      </div>
      <div className={smallCard}>
        <p className={text.label}>Current Dose</p>
        <p className={text.value}>{stats.totalCurrentDose.toFixed(2)}mg</p>
      </div>
      <div className={smallCard}>
        <p className={text.label}>Current Level</p>
        <p className={text.value}>{stats.currentLevel.toFixed(2)}mg</p>
      </div>
      <div className={smallCard}>
        <p className={text.label}>Planned Doses</p>
        <p className={text.value}>{stats.plannedDoses}</p>
      </div>
      <div className={smallCard}>
        <p className={text.label}>Logged Doses</p>
        <p className={text.value}>{stats.thisMonth}</p>
      </div>
    </div>
  );
};

export default DoseStatsGrid;
