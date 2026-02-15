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
            <label htmlFor="vial-capacity" className="block text-sm font-medium text-accent-purple-light mb-1">
              Vial Capacity (mg)
            </label>
            <input
              type="number"
              id="vial-capacity"
              min="1"
              step="0.1"
              value={vialCapacity}
              onChange={(e) => setVialCapacity(e.target.value)}
              className="w-full px-3 py-2 border border-accent-purple-light/30 bg-card-bg backdrop-blur-sm text-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium placeholder-text-muted transition-all duration-300"
              placeholder="e.g., 10"
              required
            />
          </div>

          <div>
            <label htmlFor="bacteriostatic-water" className="block text-sm font-medium text-accent-purple-light mb-1">
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
              className="w-full px-3 py-2 border border-accent-purple-light/30 bg-card-bg backdrop-blur-sm text-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium placeholder-text-muted transition-all duration-300"
              placeholder="e.g., 2"
              required
            />
          </div>

          <div>
            <label htmlFor="desired-dose" className="block text-sm font-medium text-accent-purple-light mb-1">
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
              className="w-full px-3 py-2 border border-accent-purple-light/30 bg-card-bg backdrop-blur-sm text-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium placeholder-text-muted transition-all duration-300"
              placeholder="e.g., 2.5"
              required
            />
          </div>


        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:from-accent-purple-dark hover:to-accent-purple-medium transition-all duration-300 shadow-theme hover:shadow-theme-lg transform hover:scale-[1.02]"
        >
          Calculate Dosage
        </button>
      </form>

      {result && (
        <div className="bg-gradient-to-br from-accent-purple-light/20 to-accent-purple-medium/20 backdrop-blur-sm p-4 rounded-xl border border-accent-purple-light/30 shadow-theme">
          <h4 className="font-medium text-accent-purple-light mb-3" style={{ textShadow: '0 0 10px var(--accent-purple-light)' }}>Calculation Results</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-text-muted">Draw solution:</span>
              <span className="font-bold text-text-secondary" style={{ textShadow: '0 0 5px var(--accent-purple-light)' }}>
                {result.doseAmount.toFixed(2)} ml
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#B19CD9]/80">Concentration:</span>
              <span className="font-bold text-text-secondary" style={{ textShadow: '0 0 5px var(--accent-purple-light)' }}>
                {result.waterAmount.toFixed(1)} mg/ml
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-muted">Fill syringe to:</span>
              <span className="font-bold text-text-secondary" style={{ textShadow: '0 0 5px var(--accent-purple-light)' }}>
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