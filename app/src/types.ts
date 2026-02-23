import React from 'react';

export interface WeightMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeightEntry {
  date: string;
  weight: number;
  notes?: string;
  macros?: WeightMacros;
}

export interface SideEffect {
  name: string;
  severity: number; // 1-10
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
  notes?: string;
  sideEffects?: SideEffect[];
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
  useWheelForNumbers?: boolean;
  useWheelForDate?: boolean;
}

// ============================================
// PEPTIDE TYPES
// ============================================

export type PeptideCategory = 
  | 'healing'
  | 'growth_hormone'
  | 'fat_loss'
  | 'muscle'
  | 'longevity'
  | 'immune'
  | 'skin'
  | 'cognitive'
  | 'other';

export type PeptideFrequency = 
  | 'daily'
  | 'every_other_day'
  | 'every_3_days'
  | 'every_35_days'
  | 'every_4_days'
  | 'every_5_days'
  | 'every_6_days'
  | 'weekly'
  | 'twice_week'
  | 'biweekly'
  | 'triweekly'
  | 'monthly'
  | 'as_needed';

export type InjectionRoute = 
  | 'subcutaneous'
  | 'intramuscular'
  | 'intravenous'
  | 'oral'
  | 'topical'
  | 'intranasal'
  | 'sublingual';

export type DoseUnit = 'mg' | 'mcg' | 'iu' | 'ml';

export interface PeptideCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface Peptide {
  id: string;
  name: string;
  category: PeptideCategory;
  dose: number;
  doseUnit: DoseUnit;
  frequency: PeptideFrequency;
  preferredTime: string; // HH:mm format, e.g., "08:00"
  route: InjectionRoute;
  startDate: string;
  endDate: string | null;
  halfLifeHours: number;
  notes: string;
  color: string;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  cycles: PeptideCycle[];
}

export interface PeptideLogEntry {
  id: string;
  peptideId: string;
  date: string;
  time: string;
  dose: number;
  doseUnit: DoseUnit;
  route: InjectionRoute;
  injectionSite: string;
  painLevel: number | null;
  notes: string;
  createdAt: string;
}

// Common peptide presets for quick selection
export interface PeptidePreset {
  name: string;
  category: PeptideCategory;
  defaultDose: number;
  defaultDoseUnit: DoseUnit;
  defaultFrequency: PeptideFrequency;
  defaultPreferredTime?: string; // HH:mm format
  defaultRoute: InjectionRoute;
  halfLifeHours: number;
  description: string;
}

export const PEPTIDE_PRESETS: PeptidePreset[] = [
  // Healing peptides
  { name: 'BPC-157', category: 'healing', defaultDose: 0.5, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 4, description: 'Body Protection Compound - promotes healing' },
  { name: 'TB-500', category: 'healing', defaultDose: 2, defaultDoseUnit: 'mg', defaultFrequency: 'twice_week', defaultRoute: 'subcutaneous', halfLifeHours: 24, description: 'Thymosin Beta-4 - tissue repair' },
  { name: 'TB-500 / BPC-157 Stack', category: 'healing', defaultDose: 2, defaultDoseUnit: 'mg', defaultFrequency: 'twice_week', defaultRoute: 'subcutaneous', halfLifeHours: 24, description: 'Combined healing protocol' },
  { name: 'KPV', category: 'healing', defaultDose: 0.3, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 2, description: 'Tripeptide - anti-inflammatory' },
  { name: 'PEG-MGF', category: 'healing', defaultDose: 0.2, defaultDoseUnit: 'mg', defaultFrequency: 'every_other_day', defaultRoute: 'subcutaneous', halfLifeHours: 6, description: ' mechano Growth Factor - muscle repair' },
  
  // Growth Hormone peptides
  { name: 'CJC-1295', category: 'growth_hormone', defaultDose: 0.1, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 168, description: 'GHRH analog - increases GH' },
  { name: 'CJC-1295 + Ipamorelin', category: 'growth_hormone', defaultDose: 0.1, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 168, description: 'GHRH + GHRP stack' },
  { name: 'Ipamorelin', category: 'growth_hormone', defaultDose: 0.2, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 2, description: 'GHRP - growth hormone secretagogue' },
  { name: 'Tesamorelin', category: 'growth_hormone', defaultDose: 2, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 2, description: 'GHRH analog - increases GH and IGF-1' },
  { name: ' Sermorelin', category: 'growth_hormone', defaultDose: 0.3, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 12, description: 'GHRH analog' },
  { name: 'GHRP-2', category: 'growth_hormone', defaultDose: 0.1, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 0.5, description: 'GHRP - appetite boost' },
  { name: 'GHRP-6', category: 'growth_hormone', defaultDose: 0.1, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 1.5, description: 'GHRP - strong appetite boost' },
  
  // Fat loss peptides
  { name: 'AOD-9604', category: 'fat_loss', defaultDose: 0.3, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 3, description: 'HGH fragment - fat oxidation' },
  { name: 'Melanotan II', category: 'fat_loss', defaultDose: 1, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 12, description: 'Melanocortin analog - tan + appetite suppression' },
  { name: 'PT-141', category: 'fat_loss', defaultDose: 2, defaultDoseUnit: 'mg', defaultFrequency: 'as_needed', defaultRoute: 'subcutaneous', halfLifeHours: 8, description: 'Melanocortin - appetite suppression' },
  { name: '5-Amino-1MQ', category: 'fat_loss', defaultDose: 50, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 6, description: 'NNMT inhibitor - fat loss' },
  
  // Muscle building peptides
  { name: 'S-23', category: 'muscle', defaultDose: 10, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'oral', halfLifeHours: 12, description: 'SARM - muscle building' },
  { name: 'LGD-4033', category: 'muscle', defaultDose: 10, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'oral', halfLifeHours: 24, description: 'SARM - muscle building' },
  { name: 'RAD-140', category: 'muscle', defaultDose: 10, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'oral', halfLifeHours: 16, description: 'SARM - muscle building' },
  { name: 'MK-677', category: 'muscle', defaultDose: 25, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'oral', halfLifeHours: 24, description: 'Ibutamoren - GH secretagogue' },
  
  // Longevity peptides
  { name: 'Epithalon', category: 'longevity', defaultDose: 10, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 1, description: 'Telomerase activator' },
  { name: 'FOXO3-DT', category: 'longevity', defaultDose: 10, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 6, description: 'FOXO3 gene activator' },
  { name: 'NAD+', category: 'longevity', defaultDose: 500, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 4, description: 'Nicotinamide riboside - cellular energy' },
  { name: 'NMN', category: 'longevity', defaultDose: 500, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'sublingual', halfLifeHours: 3, description: 'NAD+ precursor' },
  
  // Immune peptides
  { name: 'Thymosin Beta-4', category: 'immune', defaultDose: 2, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 24, description: 'Immune modulation' },
  { name: 'LL-37', category: 'immune', defaultDose: 1, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 2, description: 'Cathelicidin - antimicrobial' },
  
  // Skin peptides
  { name: 'GHK-Cu', category: 'skin', defaultDose: 2, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'topical', halfLifeHours: 1, description: 'Copper peptide - skin healing' },
  { name: 'Matrixyl', category: 'skin', defaultDose: 10, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'topical', halfLifeHours: 1, description: 'Collagen stimulator' },
  
  // Cognitive peptides
  { name: 'Selank', category: 'cognitive', defaultDose: 0.3, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'intranasal', halfLifeHours: 2, description: 'Nootropic - anxiety reduction' },
  { name: 'Noopept', category: 'cognitive', defaultDose: 10, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'sublingual', halfLifeHours: 12, description: 'Nootropic - cognitive enhancement' },
  { name: 'Dihexa', category: 'cognitive', defaultDose: 15, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'oral', halfLifeHours: 12, description: 'Cognitive enhancer - neuroprotective' },
  { name: 'Semax', category: 'cognitive', defaultDose: 0.9, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'intranasal', halfLifeHours: 1, description: 'ACTH analog - cognitive & immune boost' },
  
  // Additional Growth Hormone peptides
  { name: 'GLOW', category: 'growth_hormone', defaultDose: 0.3, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 2, description: 'GHRP-2 + GHRP-6 hybrid - strong GH release' },
  { name: 'KLOW', category: 'growth_hormone', defaultDose: 1, defaultDoseUnit: 'mg', defaultFrequency: 'weekly', defaultRoute: 'subcutaneous', halfLifeHours: 168, description: 'CJC-1295 DAC - sustained GH release' },
  { name: 'Hexarelin', category: 'growth_hormone', defaultDose: 0.2, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 3, description: 'GHRP - strongest GH release' },
  { name: 'GHRP-3', category: 'growth_hormone', defaultDose: 0.1, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 0.5, description: 'GHRP - moderate GH release' },
  
  // Additional healing peptides
  { name: 'Heparin', category: 'healing', defaultDose: 50, defaultDoseUnit: 'iu', defaultFrequency: 'daily', defaultRoute: 'subcutaneous', halfLifeHours: 1, description: 'Wound healing enhancement' },
  
  // Additional fat loss peptides
  { name: 'Tesofensine', category: 'fat_loss', defaultDose: 0.5, defaultDoseUnit: 'mg', defaultFrequency: 'daily', defaultRoute: 'oral', halfLifeHours: 200, description: 'Triple monoamine reuptake inhibitor' },
];