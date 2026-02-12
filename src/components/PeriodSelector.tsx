import React from 'react';
import { ChartPeriod } from '../hooks';
import { useThemeStyles } from '../contexts/ThemeContext';

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
      <div className="flex gap-2">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className={button(value === period.value)}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PeriodSelector;
