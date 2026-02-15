import { useMemo } from 'react';
import { GLP1Entry } from '../../types';
import { getMedicationColor, shortenMedicationName } from './weightChartUtils';

interface DoseChange {
  date: string;
  dose: number;
  medication: string;
  color: string;
}

export const useDoseChanges = (
  medicationData: GLP1Entry[]
): DoseChange[] => {
  return useMemo(() => {
    if (!medicationData || medicationData.length === 0) return [];

    const sortedMeds = [...medicationData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const allMedications = Array.from(new Set(sortedMeds.map((e) => e.medication)));
    const medicationColors: Record<string, { stroke: string; fill: string }> = {};
    allMedications.forEach((med, index) => {
      medicationColors[med] = getMedicationColor(index);
    });

    const changes: DoseChange[] = [];
    const lastDosePerMed: Record<string, number> = {};

    for (const entry of sortedMeds) {
      const prevDose = lastDosePerMed[entry.medication];
      if (prevDose === undefined) {
        lastDosePerMed[entry.medication] = entry.dose;
        changes.push({
          date: entry.date,
          dose: entry.dose,
          medication: entry.medication,
          color: medicationColors[entry.medication]?.stroke || '#4ADEA8',
        });
      } else if (entry.dose > prevDose) {
        lastDosePerMed[entry.medication] = entry.dose;
        changes.push({
          date: entry.date,
          dose: entry.dose,
          medication: entry.medication,
          color: medicationColors[entry.medication]?.stroke || '#4ADEA8',
        });
      } else if (entry.dose < prevDose) {
        lastDosePerMed[entry.medication] = entry.dose;
      }
    }

    return changes;
  }, [medicationData]);
};
