import React, { useState } from 'react';

interface WeightInputProps {
  onAddWeight: (weight: number) => void;
}

const WeightInput: React.FC<WeightInputProps> = ({ onAddWeight }) => {
  const [weight, setWeight] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightValue = parseFloat(weight);
    if (weightValue && weightValue > 0 && weightValue < 500) {
      onAddWeight(weightValue);
      setWeight('');
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Today's Weight</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg)
          </label>
          <input
            type="number"
            id="weight"
            step="0.1"
            min="1"
            max="500"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your weight"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          Add Weight
        </button>
      </form>
    </div>
  );
};

export default WeightInput;