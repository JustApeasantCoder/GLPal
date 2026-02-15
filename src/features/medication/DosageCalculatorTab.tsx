import React from 'react';
import DosageCalculator from './components/DosageCalculator';

const DosageCalculatorTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-6 border border-[#9C7BD3]/20">
        <h2 className="text-xl font-semibold text-[#4ADEA8] mb-6" style={{ textShadow: '0 0 15px rgba(74,222,168,0.5)' }}>
          Dosage Calculator
        </h2>
        <DosageCalculator />
      </div>
    </div>
  );
};

export default DosageCalculatorTab;