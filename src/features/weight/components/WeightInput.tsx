import React, { useState } from 'react';
import { UnitSystem } from '../../../types';
import { convertWeightToKg } from '../../../shared/utils/unitConversion';
import Button from '../../../shared/components/Button';
import WeightWheelPickerModal from './WeightWheelPickerModal';
import { useTheme } from '../../../contexts/ThemeContext';

interface WeightInputProps {
  onAddWeight: (weight: number) => void;
  unitSystem?: UnitSystem;
  lastWeight?: number | null;
  useWheelForNumbers?: boolean;
}

const WeightInput: React.FC<WeightInputProps> = ({ onAddWeight, unitSystem = 'metric', lastWeight, useWheelForNumbers = false }) => {
  const { isDarkMode } = useTheme();
  const defaultWeight = lastWeight 
    ? String(Math.round(lastWeight * 10) / 10)
    : (unitSystem === 'imperial' ? '180' : '80');
  const [showPicker, setShowPicker] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const maxWeight = unitSystem === 'imperial' ? 1100 : 500;

  const handleSave = (value: string) => {
    const weightValue = parseFloat(value);
    if (weightValue && weightValue > 0 && weightValue < maxWeight) {
      const weightInKg = convertWeightToKg(weightValue, unitSystem);
      onAddWeight(weightInKg);
    }
  };

  const handleKeyboardSubmit = () => {
    const weightValue = parseFloat(inputValue);
    if (weightValue && weightValue > 0 && weightValue < maxWeight) {
      const weightInKg = convertWeightToKg(weightValue, unitSystem);
      onAddWeight(weightInKg);
      setInputValue('');
    }
  };

  return (
    <div>
      {useWheelForNumbers ? (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className={`w-full px-3 py-2 border rounded-lg text-sm text-left transition-all ${
            isDarkMode
              ? 'border-[#B19CD9]/50 bg-black/40 text-[#B19CD9]'
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        >
          + Log Weight
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleKeyboardSubmit()}
            className={`flex-1 px-3 py-2 border rounded-lg text-sm transition-all ${
              isDarkMode
                ? 'border-[#B19CD9]/50 bg-black/40 text-[#B19CD9] placeholder-[#B19CD9]/50'
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
            }`}
            placeholder={`Enter weight (${unitSystem === 'imperial' ? 'lbs' : 'kg'})`}
          />
          <button
            type="button"
            onClick={handleKeyboardSubmit}
            className="px-4 py-2 bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white rounded-lg text-sm font-medium"
          >
            Add
          </button>
        </div>
      )}

      <WeightWheelPickerModal
        isOpen={showPicker}
        onSave={handleSave}
        onClose={() => setShowPicker(false)}
        min={1}
        max={maxWeight}
        label="Select Weight"
        decimals={1}
        defaultValue={defaultWeight}
      />
    </div>
  );
};

export default WeightInput;
