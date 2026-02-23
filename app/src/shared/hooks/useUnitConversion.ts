import { useMemo } from 'react';
import { UnitSystem } from '../../types';
import { 
  cmToInches,
  cmToFeetInches,
  feetInchesToCm,
  convertWeightFromKg,
  convertWeightToKg,
  convertHeightFromCm,
  convertHeightToCm,
  getWeightUnit,
  getHeightUnit
} from '../utils/unitConversion';

interface UseUnitConversionOptions {
  unitSystem: UnitSystem;
  decimalPlaces?: number;
}

export const useUnitConversion = ({ unitSystem, decimalPlaces = 1 }: UseUnitConversionOptions) => {
  return useMemo(() => {
    const formatNumber = (value: number): string => {
      return value % 1 === 0 ? value.toString() : value.toFixed(decimalPlaces);
    };

    return {
      // Weight conversion helpers
      convertWeight: {
        toDisplay: (kg: number) => formatNumber(convertWeightFromKg(kg, unitSystem)),
        fromDisplay: (displayValue: number) => convertWeightToKg(displayValue, unitSystem),
        getUnit: () => getWeightUnit(unitSystem),
        getMaxValue: () => unitSystem === 'imperial' ? 1100 : 500,
        getMinValue: () => unitSystem === 'imperial' ? 66 : 30
      },

      // Height conversion helpers  
      convertHeight: {
        toDisplay: (cm: number) => convertHeightFromCm(cm, unitSystem),
        fromDisplay: (displayValue: number) => convertHeightToCm(displayValue, unitSystem),
        getUnit: () => getHeightUnit(unitSystem),
        getFeetInches: (cm: number) => {
          const totalInches = cmToInches(cm);
          return {
            feet: Math.floor(totalInches / 12),
            inches: Math.round(totalInches % 12)
          };
        },
        fromFeetInches: (feet: number, inches: number) => feetInchesToCm(feet, inches)
      },

      // Goal weight management
      manageGoalWeight: {
        formatForDisplay: (kgValue?: number) => {
          if (!kgValue) return '';
          const converted = convertWeightFromKg(kgValue, unitSystem);
          return formatNumber(converted);
        },
        parseFromDisplay: (displayValue: string) => {
          if (!displayValue) return undefined;
          const parsed = parseFloat(displayValue);
          if (!parsed || parsed <= 0) return undefined;
          return convertWeightToKg(parsed, unitSystem);
        }
      },

      // Weight loss calculations
      weightLoss: {
        getLossTargets: () => ({
          weekly0_5: unitSystem === 'imperial' ? 1.1 : 0.5,
          weekly1_0: unitSystem === 'imperial' ? 2.2 : 1.0
        }),
        formatLoss: (kg: number) => `${formatNumber(convertWeightFromKg(kg, unitSystem))} ${getWeightUnit(unitSystem)}`
      },

      // BMI display helpers
      bmi: {
        formatWeight: (kg: number) => `${formatNumber(convertWeightFromKg(kg, unitSystem))} ${getWeightUnit(unitSystem)}`,
        formatHeight: (cm: number) => {
          if (unitSystem === 'imperial') {
            const { feet, inches } = cmToFeetInches(cm);
            return `${feet}'${inches}"`;
          }
          return `${cm} ${getHeightUnit(unitSystem)}`;
        }
      },

      // Direct access to unit system
      unitSystem,
      isMetric: unitSystem === 'metric',
      isImperial: unitSystem === 'imperial'
    };
  }, [unitSystem, decimalPlaces]);
};

// Non-hook utility for non-react usage
export const createUnitConverter = (unitSystem: UnitSystem, decimalPlaces = 1) => {
  const formatNumber = (value: number): string => {
    return value % 1 === 0 ? value.toString() : value.toFixed(decimalPlaces);
  };

  return {
    // Weight conversion helpers
    convertWeight: {
      toDisplay: (kg: number) => formatNumber(convertWeightFromKg(kg, unitSystem)),
      fromDisplay: (displayValue: number) => convertWeightToKg(displayValue, unitSystem),
      getUnit: () => getWeightUnit(unitSystem),
      getMaxValue: () => unitSystem === 'imperial' ? 1100 : 500,
      getMinValue: () => unitSystem === 'imperial' ? 66 : 30
    },

    // Height conversion helpers  
    convertHeight: {
      toDisplay: (cm: number) => convertHeightFromCm(cm, unitSystem),
      fromDisplay: (displayValue: number) => convertHeightToCm(displayValue, unitSystem),
      getUnit: () => getHeightUnit(unitSystem),
      getFeetInches: (cm: number) => {
        const totalInches = cmToInches(cm);
        return {
          feet: Math.floor(totalInches / 12),
          inches: Math.round(totalInches % 12)
        };
      },
      fromFeetInches: (feet: number, inches: number) => feetInchesToCm(feet, inches)
    },

    // Goal weight management
    manageGoalWeight: {
      formatForDisplay: (kgValue?: number) => {
        if (!kgValue) return '';
        const converted = convertWeightFromKg(kgValue, unitSystem);
        return formatNumber(converted);
      },
      parseFromDisplay: (displayValue: string) => {
        if (!displayValue) return undefined;
        const parsed = parseFloat(displayValue);
        if (!parsed || parsed <= 0) return undefined;
        return convertWeightToKg(parsed, unitSystem);
      }
    },

    // Weight loss calculations
    weightLoss: {
      getLossTargets: () => ({
        weekly0_5: unitSystem === 'imperial' ? 1.1 : 0.5,
        weekly1_0: unitSystem === 'imperial' ? 2.2 : 1.0
      }),
      formatLoss: (kg: number) => `${formatNumber(convertWeightFromKg(kg, unitSystem))} ${getWeightUnit(unitSystem)}`
    },

    // BMI display helpers
    bmi: {
      formatWeight: (kg: number) => `${formatNumber(convertWeightFromKg(kg, unitSystem))} ${getWeightUnit(unitSystem)}`,
      formatHeight: (cm: number) => {
        if (unitSystem === 'imperial') {
          const { feet, inches } = cmToFeetInches(cm);
          return `${feet}'${inches}"`;
        }
        return `${cm} ${getHeightUnit(unitSystem)}`;
      }
    },

    // Direct access to unit system
    unitSystem,
    isMetric: unitSystem === 'metric',
    isImperial: unitSystem === 'imperial'
  };
};