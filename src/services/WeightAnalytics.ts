import { WeightEntry, UserProfile } from '../types';

export interface WeightMetrics {
  currentWeight: number;
  startWeight: number;
  totalLoss: number;
  totalLossPercentage: number;
  weeklyAverageLoss: number;
  monthlyAverageLoss: number;
  bmi: number;
  goalWeight: number;
}

export class WeightAnalytics {
  static calculateBMI(currentWeight: number, heightCm: number): number {
    const heightInMeters = heightCm / 100;
    return currentWeight / (heightInMeters * heightInMeters);
  }

  static calculateAverages(weights: WeightEntry[]) {
    if (weights.length < 2) {
      return { weeklyAverageLoss: 0, monthlyAverageLoss: 0 };
    }

    const totalLoss = weights[0].weight - weights[weights.length - 1].weight;
    const daysElapsed = weights.length - 1;

    const weeklyAverageLoss = (totalLoss / daysElapsed) * 7;
    const monthlyAverageLoss = (totalLoss / daysElapsed) * 30;

    return { weeklyAverageLoss, monthlyAverageLoss };
  }

  static calculateMetrics(weights: WeightEntry[], profile: UserProfile, goalWeight: number = 80): WeightMetrics {
    const currentWeight = weights[weights.length - 1]?.weight || 0;
    const startWeight = weights[0]?.weight || currentWeight;
    
    // Calculate total loss and percentage
    const totalLoss = startWeight - currentWeight;
    const totalLossPercentage = startWeight > 0 ? (totalLoss / startWeight) * 100 : 0;
    
    // Calculate averages
    const { weeklyAverageLoss, monthlyAverageLoss } = this.calculateAverages(weights);
    
    // Calculate BMI
    const bmi = this.calculateBMI(currentWeight, profile.height);

    return {
      currentWeight,
      startWeight,
      totalLoss,
      totalLossPercentage,
      weeklyAverageLoss,
      monthlyAverageLoss,
      bmi,
      goalWeight
    };
  }

  static calculateBestWeek(weights: WeightEntry[]): number {
    if (weights.length < 2) return 0;

    const weeklyLosses: number[] = [];
    
    for (let i = 0; i < weights.length; i++) {
      const weekStart = Math.floor(i / 7);
      
      // Find the start of this week
      let weekStartIndex = 0;
      for (let j = 0; j < i; j++) {
        if (Math.floor(j / 7) === weekStart) {
          weekStartIndex = j;
          break;
        }
      }
      
      if (weekStartIndex === 0) continue;
      
      const weekEndIndex = Math.min(weekStartIndex + 6, weights.length - 1);
      const weekWeights = weights.slice(weekStartIndex, weekEndIndex + 1);
      
      if (weekWeights.length < 2) continue;
      
      const weekStartWeight = weekWeights[0].weight;
      const weekEndWeight = weekWeights[weekWeights.length - 1].weight;
      weeklyLosses.push(weekStartWeight - weekEndWeight);
    }

    return weeklyLosses.length > 0 ? Math.max(...weeklyLosses) : 0;
  }

  static calculateBestMonth(weights: WeightEntry[]): number {
    if (weights.length < 2) return 0;

    const monthlyLosses: number[] = [];
    
    for (let i = 1; i < weights.length; i++) {
      const currentMonth = new Date(weights[i].date).getMonth();
      const prevMonth = new Date(weights[i - 1].date).getMonth();
      
      if (prevMonth === currentMonth) {
        monthlyLosses.push(weights[i - 1].weight - weights[i].weight);
      }
    }

    return monthlyLosses.length > 0 ? Math.max(...monthlyLosses) : 0;
  }
}