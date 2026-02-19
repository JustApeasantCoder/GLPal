import React from 'react';
import DosageCalculator from './components/DosageCalculator';
import { useThemeStyles } from '../../contexts/ThemeContext';

const DosageCalculatorTab: React.FC = () => {
  const { card } = useThemeStyles();
  return (
    <div className="space-y-4">
      <div className={`${card} p-6`}>
        <h2 className="text-xl font-semibold text-[#4ADEA8] mb-6" style={{ textShadow: '0 0 15px rgba(74,222,168,0.5)' }}>
          Dosage Calculator
        </h2>
        <DosageCalculator />
      </div>
    </div>
  );
};

export default DosageCalculatorTab;