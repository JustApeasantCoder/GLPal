import { useMemo } from 'react';
import { GLP1Entry, WeightEntry } from '../types';
import { getMedicationColor } from '../utils/chartUtils';

interface ProcessedMedicationData {
  medications: string[];
  medicationColors: Record<string, { stroke: string; fill: string }>;
  dosesByMed: Record<string, { date: Date; dose: number }[]>;
  halfLifeByMed: Record<string, number>;
}

export const useMedicationChartData = (
  data: GLP1Entry[]
): ProcessedMedicationData => {
  return useMemo(() => {
    if (data.length === 0) {
      return {
        medications: [],
        medicationColors: {},
        dosesByMed: {},
        halfLifeByMed: {},
      };
    }

    const sortedData = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const medsArray = sortedData.map((e) => e.medication);
    const medications = Array.from(new Set(medsArray));

    const medicationColors: Record<string, { stroke: string; fill: string }> = {};
    medications.forEach((med, index) => {
      medicationColors[med] = getMedicationColor(index);
    });

    const dosesByMed: Record<string, { date: Date; dose: number }[]> = {};
    medications.forEach((med) => {
      dosesByMed[med] = sortedData
        .filter((e) => e.medication === med)
        .map((e) => ({ date: new Date(e.date), dose: e.dose }));
    });

    const halfLifeByMed: Record<string, number> = {};
    medications.forEach((med) => {
      const medData = sortedData.find((e) => e.medication === med);
      if (medData) halfLifeByMed[med] = medData.halfLifeHours;
    });

    return {
      medications,
      medicationColors,
      dosesByMed,
      halfLifeByMed,
    };
  }, [data]);
};

interface ProcessedWeightData {
  sortedData: { date: Date; weight: number; displayDate: string }[];
  minWeight: number;
  maxWeight: number;
  weightPadding: number;
}

export const useWeightChartData = (
  data: WeightEntry[]
): ProcessedWeightData => {
  return useMemo(() => {
    if (data.length === 0) {
      return {
        sortedData: [],
        minWeight: 0,
        maxWeight: 0,
        weightPadding: 5,
      };
    }

    const sortedData = [...data]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((entry) => ({
        date: new Date(entry.date),
        weight: entry.weight,
        displayDate: new Date(entry.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      }));

    const weights = sortedData.map((d) => d.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightPadding = (maxWeight - minWeight) * 0.1 || 5;

    return {
      sortedData,
      minWeight,
      maxWeight,
      weightPadding,
    };
  }, [data]);
};
