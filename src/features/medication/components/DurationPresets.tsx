import React from 'react';
import { durationPresets } from './protocolUtils';

interface DurationPresetsProps {
  selectedDays: number;
  onSelect: (days: number) => void;
}

const DurationPresets: React.FC<DurationPresetsProps> = ({
  selectedDays,
  onSelect,
}) => {
  return (
    <div className="flex gap-2 mt-2">
      {durationPresets.map((preset) => {
        const isSelected = selectedDays === preset.days;
        return (
          <button
            key={preset.label}
            type="button"
            onClick={() => onSelect(preset.days)}
            className={`flex-1 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
              isSelected
                ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
};

export default DurationPresets;
