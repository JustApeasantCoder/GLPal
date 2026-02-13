import React from 'react';

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface GLP1Entry {
  date: string;
  medication: string;
  dose: number;
  halfLifeHours: number;
}

export interface GLP1Protocol {
  id: string;
  medication: string;
  dose: number;
  frequencyPerWeek: number;
  startDate: string;
  stopDate: string | null; // null means ongoing
  halfLifeHours: number;
  isArchived?: boolean; // true if archived (moved to manual entries)
}

export type UnitSystem = 'metric' | 'imperial';

export interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  height: number; // cm (stored as metric internally)
  activityLevel: number; // multiplier
  goalWeight?: number; // kg (stored as metric internally)
  unitSystem?: UnitSystem; // preferred display units
}