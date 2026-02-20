import { CsvRow, CSV_HEADER, ALL_COLUMNS, SIDE_EFFECT_COLUMNS } from './csvTypes';
import { WeightEntry, GLP1Entry, UserProfile, SideEffect, GLP1Protocol } from '../types';
import { getWeightEntries, getAllMedicationEntries, getUserProfile, getMedicationProtocols } from '../shared/utils/database';

const escapeCsvValue = (value: string | number | boolean | undefined): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const formatDate = (date: string): string => date;
const formatTime = (time?: string): string => time || '';

const weightToExportUnit = (weight: number, unitSystem?: 'metric' | 'imperial'): number => {
  if (unitSystem === 'imperial') {
    return Math.round(weight * 2.20462 * 100) / 100;
  }
  return Math.round(weight * 100) / 100;
};

const createSideEffectMap = (sideEffects?: SideEffect[]): Record<string, number> => {
  const map: Record<string, number> = {};
  if (!sideEffects) return map;
  
  sideEffects.forEach(se => {
    const key = se.name.toLowerCase().replace(/\s+/g, '');
    map[key] = se.severity;
  });
  
  return map;
};

const getSideEffectValue = (sideEffectMap: Record<string, number>, key: string): number | undefined => {
  return sideEffectMap[key];
};

export const exportAllToCsv = (): string => {
  const profile = getUserProfile();
  const unitSystem = profile?.unitSystem || 'metric';
  
  const weightEntries = getWeightEntries();
  const doseEntries = getAllMedicationEntries();
  
  const dateToRowMap = new Map<string, CsvRow>();
  
  weightEntries.forEach((entry: WeightEntry) => {
    const key = entry.date;
    const existing = dateToRowMap.get(key) || {};
    dateToRowMap.set(key, {
      ...existing,
      date: formatDate(entry.date),
      weight: weightToExportUnit(entry.weight, unitSystem),
      calories: entry.macros?.calories,
      protein: entry.macros?.protein,
      carbs: entry.macros?.carbs,
      fat: entry.macros?.fat,
      notes: entry.notes,
    });
  });
  
  doseEntries.forEach((entry: GLP1Entry) => {
    const key = entry.date;
    const existing = dateToRowMap.get(key) || {};
    const sideEffectMap = createSideEffectMap(entry.sideEffects);
    
    const sideEffects: Partial<CsvRow> = {};
    SIDE_EFFECT_COLUMNS.forEach(se => {
      const value = getSideEffectValue(sideEffectMap, se);
      if (value !== undefined) {
        (sideEffects as any)[se] = value;
      }
    });
    
    dateToRowMap.set(key, {
      ...existing,
      date: formatDate(entry.date),
      time: formatTime(entry.time),
      medication: entry.medication,
      dose: entry.dose,
      painLevel: entry.painLevel,
      injectionSite: entry.injectionSite,
      isr: entry.isr,
      notes: entry.notes || existing.notes,
      ...sideEffects,
    });
  });
  
  let rows = Array.from(dateToRowMap.values());
  
  if (profile) {
    const userSettingsRow: CsvRow = {
      unitSystem: profile.unitSystem,
      age: profile.age,
      gender: profile.gender,
      height: profile.height,
      activityLevel: profile.activityLevel,
      goalWeight: profile.goalWeight,
      useWheelForNumbers: profile.useWheelForNumbers,
      useWheelForDate: profile.useWheelForDate,
    };
    rows.push(userSettingsRow);
  }
  
  if (rows.length === 0) {
    return CSV_HEADER + '\n';
  }
  
  const csvLines = [CSV_HEADER];
  
  rows.forEach(row => {
    const values = ALL_COLUMNS.map(col => escapeCsvValue(row[col as keyof CsvRow]));
    csvLines.push(values.join(','));
  });
  
  return csvLines.join('\n');
};

export const generateExportFilename = (): string => {
  const today = new Date().toISOString().split('T')[0];
  return `glpal_export_${today}.csv`;
};

export const downloadCsv = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
