import React, { useState } from 'react';
import { UnitSystem } from '../../../types';
import { convertWeightToKg } from '../../../shared/utils/unitConversion';
import Button from '../../../shared/components/Button';
import WeightWheelPickerModal from './WeightWheelPickerModal';
import { useTheme, useThemeStyles } from '../../../contexts/ThemeContext';

interface WeightInputProps {
  onAddWeight: (weight: number) => void;
  unitSystem?: UnitSystem;
  lastWeight?: number | null;
  useWheelForNumbers?: boolean;
}

const WeightInput: React.FC<WeightInputProps> = ({ onAddWeight, unitSystem = 'metric', lastWeight, useWheelForNumbers = false }) => {
  const { isDarkMode } = useTheme();
  const { inputButton, input: inputStyle, primaryButton } = useThemeStyles();
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
          className={inputButton}
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
            className={`${inputStyle} flex-1`}
            placeholder={`Enter weight (${unitSystem === 'imperial' ? 'lbs' : 'kg'})`}
          />
          <button
            type="button"
            onClick={handleKeyboardSubmit}
            className={`${primaryButton} flex-1`}
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
