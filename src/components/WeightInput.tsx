import React, { useState } from 'react';
import { UnitSystem } from '../types';
import { getWeightUnit, convertWeightToKg } from '../utils/unitConversion';

interface WeightInputProps {
  onAddWeight: (weight: number) => void;
  unitSystem?: UnitSystem;
}

const WeightInput: React.FC<WeightInputProps> = ({ onAddWeight, unitSystem = 'metric' }) => {
  const [weight, setWeight] = useState<string>('');

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightValue = parseFloat(weight);
    const maxWeight = unitSystem === 'imperial' ? 1100 : 500;
    if (weightValue && weightValue > 0 && weightValue < maxWeight) {
      const weightInKg = convertWeightToKg(weightValue, unitSystem);
      onAddWeight(weightInKg);
      setWeight('');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
<input
            type="number"
            id="weight"
            step="0.1"
            min="1"
            max={unitSystem === 'imperial' ? "1100" : "500"}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-2 border border-accent-purple-light/30 bg-card-bg backdrop-blur-sm text-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium placeholder-text-muted transition-all duration-300"
            placeholder={`Enter your weight (${getWeightUnit(unitSystem)})`}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:from-accent-purple-dark hover:to-accent-purple-medium transition-all duration-300 shadow-theme hover:shadow-theme-lg transform hover:scale-[1.02]"
        >
          Log Weight
        </button>
      </form>
    </div>
  );
};

export default WeightInput;