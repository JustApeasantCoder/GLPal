// Define UnitSystem type locally to avoid circular imports
export type UnitSystem = 'metric' | 'imperial';

// Weight conversion constants
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

// Height conversion constants  
const CM_TO_INCHES = 0.393701;
const INCHES_TO_CM = 2.54;

// Weight conversions
export const kgToLbs = (kg: number): number => kg * KG_TO_LBS;
export const lbsToKg = (lbs: number): number => lbs * LBS_TO_KG;

// Height conversions
export const cmToInches = (cm: number): number => cm * CM_TO_INCHES;
export const inchesToCm = (inches: number): number => inches * INCHES_TO_CM;
export const cmToFeetInches = (cm: number): { feet: number; inches: number } => {
  const totalInches = cmToInches(cm);
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};
export const feetInchesToCm = (feet: number, inches: number): number => {
  const totalInches = feet * 12 + inches;
  return inchesToCm(totalInches);
};

// Weight display formatting
export const formatWeight = (weightKg: number, unitSystem: UnitSystem = 'metric'): string => {
  if (unitSystem === 'imperial') {
    const lbs = kgToLbs(weightKg);
    const roundedLbs = Math.round(lbs * 10) / 10;
    return `${roundedLbs.toFixed(1)} lbs`;
  }
  const roundedKg = Math.round(weightKg * 10) / 10;
  return `${roundedKg.toFixed(1)}kg`;
};

// Height display formatting
export const formatHeight = (heightCm: number, unitSystem: UnitSystem = 'metric'): string => {
  if (unitSystem === 'imperial') {
    const { feet, inches } = cmToFeetInches(heightCm);
    return `${feet}'${inches}"`;
  }
  return `${heightCm} cm`;
};

// Weight input conversion (converts user input to kg for storage)
export const convertWeightToKg = (weight: number, fromUnit: UnitSystem): number => {
  if (fromUnit === 'imperial') {
    // Round to 1 decimal place to avoid floating point precision issues
    return Math.round(lbsToKg(weight) * 100) / 100;
  }
  return weight;
};

// Weight output conversion (converts stored kg to display unit)
export const convertWeightFromKg = (weightKg: number, toUnit: UnitSystem): number => {
  if (toUnit === 'imperial') {
    // Round to 1 decimal place to avoid floating point precision issues
    return Math.round(kgToLbs(weightKg) * 10) / 10;
  }
  return weightKg;
};

// Height input conversion (converts user input to cm for storage)
export const convertHeightToCm = (height: number, fromUnit: UnitSystem): number => {
  return fromUnit === 'imperial' ? inchesToCm(height) : height;
};

// Height output conversion (converts stored cm to display unit)
export const convertHeightFromCm = (heightCm: number, toUnit: UnitSystem): { value: number; unit: string } => {
  if (toUnit === 'imperial') {
    const { feet, inches } = cmToFeetInches(heightCm);
    return { value: feet * 12 + inches, unit: 'inches' };
  }
  return { value: heightCm, unit: 'cm' };
};

// Get weight unit symbol
export const getWeightUnit = (unitSystem: UnitSystem): string => {
  return unitSystem === 'imperial' ? 'lbs' : 'kg';
};

// Get height unit symbol
export const getHeightUnit = (unitSystem: UnitSystem): string => {
  return unitSystem === 'imperial' ? 'ft/in' : 'cm';
};