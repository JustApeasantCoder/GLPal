import React from 'react';

export interface WeightEntry {
  date: string;
  weight: number;
  displayWeight?: number; // For chart display with unit conversion
}

export interface GLP1Entry {
  date: string;
  medication: string;
  dose: number;
  halfLifeHours: number;
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