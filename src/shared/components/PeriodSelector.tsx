import React from 'react';
import { ChartPeriod } from '../hooks';
import { useThemeStyles } from '../../contexts/ThemeContext';

interface PeriodSelectorProps {
  value: ChartPeriod;
  onChange: (period: ChartPeriod) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => {
  const { button } = useThemeStyles();

  const periods: { value: ChartPeriod; label: string }[] = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: '90days', label: '90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="flex justify-center mb-3">
      <div className="grid grid-cols-4 gap-2 w-full">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className={`flex-1 px-2 py-2 text-sm rounded-lg transition-all duration-300 ${
              value === period.value
                ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PeriodSelector;
