import React from 'react';

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface MedicationEntry {
  date: string;
  medication: string;
  dose: number;
  halfLifeHours: number;
  isManual?: boolean;
  time?: string;
  painLevel?: number;
  injectionSite?: string;
  isr?: string;
}

export interface MedicationProtocol {
  id: string;
  medication: string;
  dose: number;
  frequencyPerWeek: number;
  startDate: string;
  stopDate: string | null;
  halfLifeHours: number;
  isArchived?: boolean;
  phase?: 'titrate' | 'maintenance';
}

export type GLP1Entry = MedicationEntry;
export type GLP1Protocol = MedicationProtocol;

export type UnitSystem = 'metric' | 'imperial';

export interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  height: number; // cm (stored as metric internally)
  activityLevel: number; // multiplier
  goalWeight?: number; // kg (stored as metric internally)
  unitSystem?: UnitSystem; // preferred display units
}