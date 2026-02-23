import React from 'react';
import DosageCalculator from './components/DosageCalculator';
import { useThemeStyles } from '../../contexts/ThemeContext';

interface DosageCalculatorTabProps {
  useWheelForNumbers?: boolean;
}

const DosageCalculatorTab: React.FC<DosageCalculatorTabProps> = ({ useWheelForNumbers = true }) => {
  const { bigCard, bigCardText } = useThemeStyles();
  return (
    <div className="space-y-4">
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>
          Peptide Calculator
        </h1>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        <DosageCalculator useWheelForNumbers={useWheelForNumbers} />
      </div>
    </div>
  );
};

export default DosageCalculatorTab;