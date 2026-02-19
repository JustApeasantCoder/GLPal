import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

interface DosageCalculatorProps {
  onClose?: () => void;
}

interface DosageResult {
  vialStrength: number;
  waterAmount: number;
  dose: number;
  syringeDraw: number;
  concentration: number;
  calculatedField: string;
}

const formatNumber = (num: number): string => {
  return num.toFixed(2).replace(/\.?0+$/, '');
};

const DosageCalculator: React.FC<DosageCalculatorProps> = ({ onClose }) => {
  const { isDarkMode } = useTheme();
  const [vialStrength, setVialStrength] = useState<string>('');
  const [waterAmount, setWaterAmount] = useState<string>('');
  const [desiredDose, setDesiredDose] = useState<string>('');
  const [syringeDraw, setSyringeDraw] = useState<string>('');
  const [result, setResult] = useState<DosageResult | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const calculateAndAutoFill = () => {
    const vial = parseFloat(vialStrength) || 0;
    const water = parseFloat(waterAmount) || 0;
    const dose = parseFloat(desiredDose) || 0;
    const syringe = parseFloat(syringeDraw) || 0;

    const filledCount = [vial, water, dose, syringe].filter(v => v > 0).length;

    if (filledCount < 3) {
      setResult(null);
      return;
    }

    let calculatedResult: DosageResult | null = null;

    if (vial > 0 && water > 0 && dose > 0) {
      const concentration = vial / water;
      const syringeUnits = (dose / concentration) * 100;
      calculatedResult = {
        vialStrength: vial,
        waterAmount: water,
        dose: dose,
        syringeDraw: syringeUnits,
        concentration,
        calculatedField: 'syringeDraw'
      };
    } else if (vial > 0 && water > 0 && syringe > 0) {
      const concentration = vial / water;
      const solutionAmount = syringe / 100;
      const calculatedDose = solutionAmount * concentration;
      calculatedResult = {
        vialStrength: vial,
        waterAmount: water,
        dose: calculatedDose,
        syringeDraw: syringe,
        concentration,
        calculatedField: 'desiredDose'
      };
    } else if (vial > 0 && dose > 0 && syringe > 0) {
      const solutionAmount = syringe / 100;
      const concentration = dose / solutionAmount;
      const calculatedWater = vial / concentration;
      calculatedResult = {
        vialStrength: vial,
        waterAmount: calculatedWater,
        dose: dose,
        syringeDraw: syringe,
        concentration,
        calculatedField: 'waterAmount'
      };
    } else if (water > 0 && dose > 0 && syringe > 0) {
      const solutionAmount = syringe / 100;
      const concentration = dose / solutionAmount;
      const calculatedVial = concentration * water;
      calculatedResult = {
        vialStrength: calculatedVial,
        waterAmount: water,
        dose: dose,
        syringeDraw: syringe,
        concentration,
        calculatedField: 'vialStrength'
      };
    }

    if (calculatedResult && calculatedResult.waterAmount > 0 && calculatedResult.vialStrength > 0) {
      setResult(calculatedResult);
      
      // Only auto-fill if no field is currently focused
      if (!focusedField) {
        if (calculatedResult.calculatedField === 'vialStrength') {
          setVialStrength(calculatedResult.vialStrength.toFixed(2));
        } else if (calculatedResult.calculatedField === 'waterAmount') {
          setWaterAmount(calculatedResult.waterAmount.toFixed(2));
        } else if (calculatedResult.calculatedField === 'desiredDose') {
          setDesiredDose(calculatedResult.dose.toFixed(2));
        } else if (calculatedResult.calculatedField === 'syringeDraw') {
          setSyringeDraw(calculatedResult.syringeDraw.toFixed(2));
        }
      }
    } else {
      setResult(null);
    }
  };

  useEffect(() => {
    calculateAndAutoFill();
  }, [vialStrength, waterAmount, desiredDose, syringeDraw, focusedField]);

  const handleBlur = (field: string) => {
    setFocusedField(null);
    calculateAndAutoFill();
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const isCalculated = (field: string) => result?.calculatedField === field;

  const getInputClass = (field: string) => {
    if (isCalculated(field)) {
      return `w-full px-3 py-2 border-2 border-[#4ADEA8] bg-[#4ADEA8]/10 rounded-lg text-sm text-[#4ADEA8] focus:outline-none focus:ring-2 focus:ring-[#4ADEA8] focus:border-[#4ADEA8] transition-all duration-300`;
    }
    return `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 transition-all duration-300 ${
      isDarkMode
        ? 'border-[#B19CD9]/30 bg-black/20 text-white placeholder-gray-400'
        : 'border-gray-300 bg-white text-gray-700 placeholder-gray-400'
    }`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label 
            htmlFor="vialStrength" 
            className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}
          >
            Vial Strength (mg)
          </label>
          <input
            type="number"
            id="vialStrength"
            step="0.1"
            value={vialStrength}
            onChange={(e) => setVialStrength(e.target.value)}
            onFocus={() => handleFocus('vialStrength')}
            onBlur={() => handleBlur('vialStrength')}
            className={getInputClass('vialStrength')}
            placeholder="e.g., 10"
          />
        </div>

        <div>
          <label 
            htmlFor="waterAmount" 
            className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}
          >
            Bacteriostatic Water (ml)
          </label>
          <input
            type="number"
            id="waterAmount"
            step="0.1"
            value={waterAmount}
            onChange={(e) => setWaterAmount(e.target.value)}
            onFocus={() => handleFocus('waterAmount')}
            onBlur={() => handleBlur('waterAmount')}
            className={getInputClass('waterAmount')}
            placeholder="e.g., 2"
          />
        </div>

        <div>
          <label 
            htmlFor="desiredDose" 
            className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}
          >
            Desired Dose (mg)
          </label>
          <input
            type="number"
            id="desiredDose"
            step="0.1"
            value={desiredDose}
            onChange={(e) => setDesiredDose(e.target.value)}
            onFocus={() => handleFocus('desiredDose')}
            onBlur={() => handleBlur('desiredDose')}
            className={getInputClass('desiredDose')}
            placeholder="e.g., 2.5"
          />
        </div>

        <div>
          <label 
            htmlFor="syringeDraw" 
            className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}
          >
            Syringe Draw (IU)
          </label>
          <input
            type="number"
            id="syringeDraw"
            step="0.1"
            value={syringeDraw}
            onChange={(e) => setSyringeDraw(e.target.value)}
            onFocus={() => handleFocus('syringeDraw')}
            onBlur={() => handleBlur('syringeDraw')}
            className={getInputClass('syringeDraw')}
            placeholder="e.g., 25"
          />
        </div>
      </div>

      {result && (
        <div className={`p-4 rounded-xl border border-[#B19CD9]/30 ${
          isDarkMode 
            ? 'bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95' 
            : 'bg-white/95'
        }`}>
          <h4 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Calculation Results</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Concentration:</span>
              <span className={`text-sm font-bold text-[#B19CD9]`}>
                {formatNumber(result.concentration)} mg/ml
              </span>
            </div>
            <div className="border-t border-[#B19CD9]/20 my-2"></div>
            <div className="flex justify-between">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Vial Strength:</span>
              <span className={`text-sm font-bold ${isCalculated('vialStrength') ? 'text-[#4ADEA8]' : 'text-[#B19CD9]'}`}>
                {formatNumber(result.vialStrength)} mg
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Water:</span>
              <span className={`text-sm font-bold ${isCalculated('waterAmount') ? 'text-[#4ADEA8]' : 'text-[#B19CD9]'}`}>
                {formatNumber(result.waterAmount)} ml
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dose:</span>
              <span className={`text-sm font-bold ${isCalculated('desiredDose') ? 'text-[#4ADEA8]' : 'text-[#B19CD9]'}`}>
                {formatNumber(result.dose)} mg
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Syringe Draw:</span>
              <span className={`text-sm font-bold ${isCalculated('syringeDraw') ? 'text-[#4ADEA8]' : 'text-[#B19CD9]'}`}>
                {formatNumber(result.syringeDraw)} IU
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DosageCalculator;