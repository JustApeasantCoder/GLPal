import { UserProfile } from '../types';

export const calculateBMR = (profile: UserProfile, currentWeight: number): number => {
  const { age, gender, height } = profile;
  const weight = currentWeight;
  
  if (gender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
};

export const calculateTDEE = (bmr: number, activityLevel: number): number => {
  return Math.round(bmr * activityLevel);
};

export const calculateWeightLossCalories = (weeklyWeightLossKg: number): number => {
  // 1kg of fat = ~7700 calories
  // Daily calorie deficit needed = (7700 * kg) / 7 days
  return Math.round((7700 * weeklyWeightLossKg) / 7);
};

export const calculateWeeklyWeightLoss = (dailyCalorieDeficit: number): number => {
  // Reverse calculation: kg per week from daily deficit
  return (dailyCalorieDeficit * 7) / 7700;
};

export const calculateMonthlyWeightLoss = (dailyCalorieDeficit: number): number => {
  // 30 days = ~4.29 weeks
  return ((dailyCalorieDeficit * 30) / 7700);
};

export const calculateBMI = (weight: number, height: number): number => {
  // Convert height from cm to meters
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

export const calculateMedicationConcentration = (
  doses: Array<{ date: Date; dose: number }>,
  halfLifeHours: number,
  currentDate: Date
): number => {
  const ABSORPTION_HOURS = 24;
  
  return doses.reduce((total, dose) => {
    const hoursElapsed = (currentDate.getTime() - dose.date.getTime()) / (1000 * 60 * 60);
    
    if (hoursElapsed < 0) {
      return total;
    }
    
    let effectFactor: number;
    
    if (hoursElapsed < ABSORPTION_HOURS) {
      const absorptionProgress = hoursElapsed / ABSORPTION_HOURS;
      effectFactor = dose.dose * absorptionProgress;
    } else {
      const decayHours = hoursElapsed - ABSORPTION_HOURS;
      const decayFactor = Math.exp(-0.693 * decayHours / halfLifeHours);
      effectFactor = dose.dose * decayFactor;
    }
    
    return total + effectFactor;
  }, 0);
};

export const calculateGLP1Concentration = calculateMedicationConcentration;