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

export const calculateGLP1Concentration = (
  doses: Array<{ date: Date; dose: number }>,
  halfLifeHours: number,
  currentDate: Date
): number => {
  return doses.reduce((total, dose) => {
    const hoursElapsed = (currentDate.getTime() - dose.date.getTime()) / (1000 * 60 * 60);
    const decayFactor = Math.exp(-0.693 * hoursElapsed / halfLifeHours);
    return total + (dose.dose * decayFactor);
  }, 0);
};