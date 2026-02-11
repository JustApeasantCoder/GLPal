import React, { useState } from 'react';

interface DosageCalculatorProps {
  onClose?: () => void;
}

interface DosageResult {
  doseAmount: number;
  waterAmount: number;
  syringeAmount: number;
}

const DosageCalculator: React.FC<DosageCalculatorProps> = ({ onClose }) => {
  const [vialCapacity, setVialCapacity] = useState<string>('10');
  const [bacteriostaticWater, setBacteriostaticWater] = useState<string>('2');
  const [desiredDose, setDesiredDose] = useState<string>('2.5');
  const [result, setResult] = useState<DosageResult | null>(null);

  const calculateDosage = () => {
    const vial = parseFloat(vialCapacity) || 0;
    const water = parseFloat(bacteriostaticWater) || 0;
    const dose = parseFloat(desiredDose) || 0;

    if (vial <= 0 || water <= 0 || dose <= 0) {
      return;
    }

    // Calculate concentration: mg/ml after mixing
    const concentration = vial / water;
    
    // Calculate how much reconstituted solution to draw (ml)
    const solutionAmount = dose / concentration;
    
    // Calculate syringe units for a 100 IU syringe (standard insulin syringe)
    const syringeUnits = solutionAmount * 100; // 1ml = 100 IU for standard insulin syringe

    setResult({
      doseAmount: solutionAmount,
      waterAmount: concentration,
      syringeAmount: syringeUnits
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateDosage();
  };

  return (
    <div className="space-y-4">

      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="vial-capacity" className="block text-sm font-medium text-[#B19CD9] mb-1">
              Vial Capacity (mg)
            </label>
            <input
              type="number"
              id="vial-capacity"
              min="1"
              step="0.1"
              value={vialCapacity}
              onChange={(e) => setVialCapacity(e.target.value)}
              className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/30 backdrop-blur-sm text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B19CD9] focus:border-[#B19CD9] placeholder-gray-400 transition-all duration-300"
              placeholder="e.g., 10"
              required
            />
          </div>

          <div>
            <label htmlFor="bacteriostatic-water" className="block text-sm font-medium text-[#B19CD9] mb-1">
              Bacteriostatic Water (ml)
            </label>
            <input
              type="number"
              id="bacteriostatic-water"
              min="0.1"
              max="50"
              step="0.1"
              value={bacteriostaticWater}
              onChange={(e) => setBacteriostaticWater(e.target.value)}
              className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/30 backdrop-blur-sm text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B19CD9] focus:border-[#B19CD9] placeholder-gray-400 transition-all duration-300"
              placeholder="e.g., 2"
              required
            />
          </div>

          <div>
            <label htmlFor="desired-dose" className="block text-sm font-medium text-[#B19CD9] mb-1">
              Desired Dose (mg)
            </label>
            <input
              type="number"
              id="desired-dose"
              min="0.1"
              max="50"
              step="0.1"
              value={desiredDose}
              onChange={(e) => setDesiredDose(e.target.value)}
              className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/30 backdrop-blur-sm text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B19CD9] focus:border-[#B19CD9] placeholder-gray-400 transition-all duration-300"
              placeholder="e.g., 2.5"
              required
            />
          </div>


        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white py-2 px-4 rounded-lg hover:from-[#2D1B4E] hover:to-[#5B4B8A] transition-all duration-300 shadow-[0_0_20px_rgba(177,156,217,0.3)] hover:shadow-[0_0_30px_rgba(45,27,78,0.5)] transform hover:scale-[1.02]"
        >
          Calculate Dosage
        </button>
      </form>

      {result && (
        <div className="bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-4 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_20px_rgba(177,156,217,0.3)]">
          <h4 className="font-medium text-[#B19CD9] mb-3 [text-shadow:0_0_10px_rgba(177,156,217,0.4)]">Calculation Results</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[#B19CD9]/80">Draw solution:</span>
              <span className="font-bold text-white [text-shadow:0_0_5px_rgba(177,156,217,0.5)]">
                {result.doseAmount.toFixed(2)} ml
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#B19CD9]/80">Concentration:</span>
              <span className="font-bold text-white [text-shadow:0_0_5px_rgba(177,156,217,0.5)]">
                {result.waterAmount.toFixed(1)} mg/ml
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#B19CD9]/80">Fill syringe to:</span>
              <span className="font-bold text-white [text-shadow:0_0_5px_rgba(177,156,217,0.5)]">
                {result.syringeAmount.toFixed(0)} IU
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DosageCalculator;