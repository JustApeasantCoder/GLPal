import { WeightEntry, UserProfile } from '../types';

export interface WeightMetrics {
  currentWeight: number;
  startWeight: number;
  totalLoss: number;
  totalLossPercentage: number;
  weeklyAverageLoss: number;
  monthlyAverageLoss: number;
  bmi: number;
  bmiCategory: { category: string; color: string };
  goalWeight: number;
}

export class WeightAnalytics {
  static calculateBMI(currentWeight: number, heightCm: number): number {
    const heightInMeters = heightCm / 100;
    return currentWeight / (heightInMeters * heightInMeters);
  }

  static getBMICategory(bmi: number): { category: string; color: string } {
    if (bmi < 18.5) {
      return { category: 'UW', color: 'text-blue-400' };
    } else if (bmi < 25) {
      return { category: 'NW', color: 'text-green-400' };
    } else if (bmi < 30) {
      return { category: 'OW', color: 'text-yellow-400' };
    } else if (bmi < 35) {
      return { category: 'OB I', color: 'text-red-400' };
    } else if (bmi < 40) {
      return { category: 'OB II', color: 'text-red-500' };
    } else {
      return { category: 'OB III', color: 'text-red-600' };
    }
  }

  static calculateAverages(weights: WeightEntry[]) {
    if (weights.length < 2) {
      return { weeklyAverageLoss: 0, monthlyAverageLoss: 0 };
    }

    const getMonthKey = (dateStr: string) => {
      const d = new Date(dateStr);
      const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      return String(firstDayOfMonth.getTime());
    };

    const getWeekKey = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.getFullYear(), d.getMonth(), diff);
      return String(monday.getTime());
    };

    const monthlyAverages: number[] = [];
    const monthlyMap = new Map<string, number[]>();
    
    for (const entry of weights) {
      const key = getMonthKey(entry.date);
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, []);
      }
      monthlyMap.get(key)!.push(entry.weight);
    }

    const sortedMonths = Array.from(monthlyMap.keys()).sort((a, b) => Number(a) - Number(b));
    for (const month of sortedMonths) {
      const values = monthlyMap.get(month)!;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      monthlyAverages.push(avg);
    }

    let monthlyAverageLoss = 0;
    if (monthlyAverages.length >= 2) {
      let totalChange = 0;
      for (let i = 1; i < monthlyAverages.length; i++) {
        totalChange += monthlyAverages[i - 1] - monthlyAverages[i];
      }
      monthlyAverageLoss = totalChange / (monthlyAverages.length - 1);
    }

    const weeklyAverages: number[] = [];
    const weeklyMap = new Map<string, number[]>();
    
    for (const entry of weights) {
      const key = getWeekKey(entry.date);
      if (!weeklyMap.has(key)) {
        weeklyMap.set(key, []);
      }
      weeklyMap.get(key)!.push(entry.weight);
    }

    const sortedWeeks = Array.from(weeklyMap.keys()).sort((a, b) => {
      const [yearA, weekA] = a.split('-').map(Number);
      const [yearB, weekB] = b.split('-').map(Number);
      return yearA - yearB || weekA - weekB;
    });
    for (const week of sortedWeeks) {
      const values = weeklyMap.get(week)!;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      weeklyAverages.push(avg);
    }

    let weeklyAverageLoss = 0;
    if (weeklyAverages.length >= 2) {
      let totalChange = 0;
      for (let i = 1; i < weeklyAverages.length; i++) {
        totalChange += weeklyAverages[i - 1] - weeklyAverages[i];
      }
      weeklyAverageLoss = totalChange / (weeklyAverages.length - 1);
    }

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
    
    // Calculate BMI and category
    const bmi = this.calculateBMI(currentWeight, profile.height);
    const bmiCategory = this.getBMICategory(bmi);

    return {
      currentWeight,
      startWeight,
      totalLoss,
      totalLossPercentage,
      weeklyAverageLoss,
      monthlyAverageLoss,
      bmi,
      bmiCategory,
      goalWeight
    };
  }

  static calculateBestWeek(weights: WeightEntry[]): number {
    if (weights.length < 2) return 0;

    const getWeekKey = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.getFullYear(), d.getMonth(), diff);
      return String(monday.getTime());
    };

    const weeklyMap = new Map<string, number[]>();
    
    for (const entry of weights) {
      const key = getWeekKey(entry.date);
      if (!weeklyMap.has(key)) {
        weeklyMap.set(key, []);
      }
      weeklyMap.get(key)!.push(entry.weight);
    }

    const sortedWeeks = Array.from(weeklyMap.keys()).sort((a, b) => Number(a) - Number(b));

    const weeklyAverages: number[] = [];
    for (const week of sortedWeeks) {
      const weekWeights = weeklyMap.get(week)!;
      const avg = weekWeights.reduce((a, b) => a + b, 0) / weekWeights.length;
      weeklyAverages.push(avg);
    }

    let bestWeek = 0;
    for (let i = 1; i < weeklyAverages.length; i++) {
      const loss = weeklyAverages[i - 1] - weeklyAverages[i];
      if (loss > bestWeek) {
        bestWeek = loss;
      }
    }

    return bestWeek;
  }

  static calculateBestMonth(weights: WeightEntry[]): number {
    if (weights.length < 2) return 0;

    const getMonthKey = (dateStr: string) => {
      const d = new Date(dateStr);
      const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      return String(firstDayOfMonth.getTime());
    };

    const monthlyMap = new Map<string, number[]>();
    
    for (const entry of weights) {
      const key = getMonthKey(entry.date);
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, []);
      }
      monthlyMap.get(key)!.push(entry.weight);
    }

    const sortedMonths = Array.from(monthlyMap.keys()).sort((a, b) => Number(a) - Number(b));

    const monthlyAverages: number[] = [];
    for (const month of sortedMonths) {
      const monthWeights = monthlyMap.get(month)!;
      const avg = monthWeights.reduce((a, b) => a + b, 0) / monthWeights.length;
      monthlyAverages.push(avg);
    }

    let bestMonth = 0;
    for (let i = 1; i < monthlyAverages.length; i++) {
      const loss = monthlyAverages[i - 1] - monthlyAverages[i];
      if (loss > bestMonth) {
        bestMonth = loss;
      }
    }

    return bestMonth;
  }
}