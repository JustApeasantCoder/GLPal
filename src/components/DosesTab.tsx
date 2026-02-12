import React from 'react';
import DosesChart from './DosesChart';
import { GLP1Entry } from '../types';
import { useThemeStyles } from '../contexts/ThemeContext';

interface DosesTabProps {
  dosesEntries: GLP1Entry[];
}

const DosesTab: React.FC<DosesTabProps> = ({ dosesEntries }) => {
  const { bigCard, bigCardText } = useThemeStyles();
  return (
    <div className="space-y-3">
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Doses</h1>
        <div className="h-64 sm:h-80">
          <DosesChart data={dosesEntries} />
        </div>
      </div>
    </div>
  );
};

export default DosesTab;
