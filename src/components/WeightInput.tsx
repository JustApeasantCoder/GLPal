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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-[#B19CD9] mb-1 [text-shadow:0_0_5px_rgba(177,156,217,0.3)]">
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
            className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/30 backdrop-blur-sm text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9C7BD3] focus:border-[#9C7BD3] placeholder-gray-400 transition-all duration-300"
            placeholder="Enter your weight"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white py-2 px-4 rounded-lg hover:from-[#2D1B4E] hover:to-[#5B4B8A] transition-all duration-300 shadow-[0_0_20px_rgba(177,156,217,0.3)] hover:shadow-[0_0_30px_rgba(45,27,78,0.5)] transform hover:scale-[1.02]"
        >
          Add Weight
        </button>
      </form>
    </div>
  );
};

export default WeightInput;