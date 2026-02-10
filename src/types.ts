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

export interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  height: number; // cm
  activityLevel: number; // multiplier
}