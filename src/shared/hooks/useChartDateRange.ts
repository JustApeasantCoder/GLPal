import { useMemo } from 'react';
import { ChartPeriod } from './useFilteredWeights';

const PERIOD_WINDOW_DAYS: Record<ChartPeriod, number> = {
  week: 14,
  month: 28,
  '90days': 90,
  all: Infinity,
};

interface DateRangeResult {
  firstDate: Date;
  lastDate: Date;
  xAxisDates: string[];
  todayIndex: number;
  zoomStart: number;
  zoomEnd: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  totalPoints: number;
}

export const useChartDateRange = (
  firstDataDate: Date,
  lastDataDate: Date,
  period: ChartPeriod,
  minDays: number = 14,
  currentDate?: Date
): DateRangeResult => {
  const now = currentDate || new Date();
  
  return useMemo(() => {
    let firstDate = new Date(firstDataDate);
    let lastDate = new Date(lastDataDate);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const dataRangeDays =
      (lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000);
    if (dataRangeDays < minDays) {
      lastDate = new Date(firstDate.getTime() + minDays * 24 * 60 * 60 * 1000);
    }

    if (lastDate < today) {
      lastDate = today;
    }

    const xAxisDates: string[] = [];
    const iterateDate = new Date(firstDate);
    while (iterateDate <= lastDate) {
      xAxisDates.push(
        iterateDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      );
      iterateDate.setDate(iterateDate.getDate() + 1);
    }

    const todayStr = today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    let todayIndex = xAxisDates.indexOf(todayStr);
    if (todayIndex === -1) {
      todayIndex = xAxisDates.length - 1;
    }

    const totalPoints = xAxisDates.length;
    const windowPoints =
      period === 'all' ? totalPoints : PERIOD_WINDOW_DAYS[period];

    let zoomStart = 0;
    let zoomEnd = 100;

    if (period !== 'all' && totalPoints >= windowPoints) {
      const todayPercent = ((todayIndex + 1) / totalPoints) * 100;
      const windowPercent = (windowPoints / totalPoints) * 100;
      const targetPosition = 0.5;
      zoomEnd = Math.min(100, todayPercent + windowPercent * (1 - targetPosition));
      zoomStart = Math.max(0, zoomEnd - windowPercent);
    }

    const visibleStartIndex = Math.floor((zoomStart / 100) * totalPoints);
    const visibleEndIndex = Math.ceil((zoomEnd / 100) * totalPoints);

    return {
      firstDate,
      lastDate,
      xAxisDates,
      todayIndex,
      zoomStart,
      zoomEnd,
      visibleStartIndex,
      visibleEndIndex,
      totalPoints,
    };
  }, [firstDataDate, lastDataDate, period, minDays]);
};

export const useWeightChartDateRange = (
  firstDataDate: Date,
  lastDataDate: Date,
  period: ChartPeriod,
  currentDate?: Date
): {
  firstDate: Date;
  lastDate: Date;
  zoomStart: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  totalPoints: number;
} => {
  const now = currentDate || new Date();
  
  return useMemo(() => {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const actualLastDate = new Date(lastDataDate);
    actualLastDate.setHours(0, 0, 0, 0);

    let lastDate = new Date(lastDataDate);
    lastDate = new Date(lastDate.getTime() + 120 * 24 * 60 * 60 * 1000);

    const actualDataDays =
      (actualLastDate.getTime() - firstDataDate.getTime()) /
      (24 * 60 * 60 * 1000);
    const totalDataDays =
      (lastDate.getTime() - firstDataDate.getTime()) / (24 * 60 * 60 * 1000);

    let daysToShow: number;
    switch (period) {
      case 'week':
        daysToShow = 14;
        break;
      case 'month':
        daysToShow = 30;
        break;
      case '90days':
        daysToShow = 90;
        break;
      case 'all':
      default:
        daysToShow = actualDataDays;
    }

    const totalPoints = Math.ceil(actualDataDays);

    let zoomStart = 0;
    const zoomEnd = 100;
    if (actualDataDays > daysToShow) {
      zoomStart = ((actualDataDays - daysToShow) / actualDataDays) * 100;
    }
    zoomStart = Math.max(0, Math.min(100, zoomStart));

    const visibleStartIndex = Math.floor((zoomStart / 100) * totalPoints);
    const visibleEndIndex = Math.ceil((zoomEnd / 100) * totalPoints);

    return {
      firstDate: new Date(firstDataDate),
      lastDate,
      zoomStart,
      visibleStartIndex,
      visibleEndIndex,
      totalPoints,
    };
  }, [firstDataDate, lastDataDate, period, now.getTime()]);
};
