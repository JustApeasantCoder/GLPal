import React, { useState } from 'react';
import { UnitSystem } from '../types';
import { convertWeightToKg } from '../utils/unitConversion';
import Button from './ui/Button';
import WeightWheelPickerModal from './ui/WeightWheelPickerModal';

interface WeightInputProps {
  onAddWeight: (weight: number) => void;
  unitSystem?: UnitSystem;
  lastWeight?: number | null;
}

const WeightInput: React.FC<WeightInputProps> = ({ onAddWeight, unitSystem = 'metric', lastWeight }) => {
  const defaultWeight = lastWeight 
    ? String(Math.round(lastWeight * 10) / 10)
    : (unitSystem === 'imperial' ? '180' : '80');
  const [showPicker, setShowPicker] = useState(false);

  const maxWeight = unitSystem === 'imperial' ? 1100 : 500;

  const handleSave = (value: string) => {
    const weightValue = parseFloat(value);
    if (weightValue && weightValue > 0 && weightValue < maxWeight) {
      const weightInKg = convertWeightToKg(weightValue, unitSystem);
      onAddWeight(weightInKg);
    }
  };

  return (
    <div>
      <Button type="button" onClick={() => setShowPicker(true)} fullWidth>
        + Log Weight
      </Button>

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
