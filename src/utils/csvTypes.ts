export const SIDE_EFFECT_COLUMNS = [
  'nausea',
  'vomiting',
  'diarrhea',
  'constipation',
  'abdominalPain',
  'headache',
  'fatigue',
  'dizziness',
  'lossOfAppetite',
  'heartburn',
] as const;

export const ALL_COLUMNS = [
  'date',
  'time',
  'weight',
  'calories',
  'protein',
  'carbs',
  'fat',
  'medication',
  'dose',
  'painLevel',
  'injectionSite',
  'isr',
  'notes',
  ...SIDE_EFFECT_COLUMNS,
  'unitSystem',
  'age',
  'gender',
  'height',
  'activityLevel',
  'goalWeight',
  'useWheelForNumbers',
  'useWheelForDate',
  // Protocol columns with P prefix
  'Pid',
  'Pmedication',
  'Pdose',
  'PfrequencyPerWeek',
  'PstartDate',
  'PstopDate',
  'PhalfLifeHours',
  'Pphase',
  // Manual medication entries with M prefix
  'Mdate',
  'Mtime',
  'Mmedication',
  'Mdose',
  'MhalfLifeHours',
  'MinjectionSite',
  'Misr',
  'Mnotes',
  'MpainLevel',
  // Peptide definitions with Pep prefix
  'PepId',
  'PepName',
  'PepCategory',
  'PepDose',
  'PepDoseUnit',
  'PepFrequency',
  'PepPreferredTime',
  'PepRoute',
  'PepStartDate',
  'PepEndDate',
  'PepHalfLifeHours',
  'PepNotes',
  'PepColor',
  'PepIsActive',
  // Peptide log entries with PL prefix
  'PLdate',
  'PLtime',
  'PLpeptideId',
  'PLpeptideName',
  'PLdose',
  'PLdoseUnit',
  'PLroute',
  'PLinjectionSite',
  'PLpainLevel',
  'PLnotes',
] as const;

export type AllColumns = typeof ALL_COLUMNS[number];

export interface CsvRow {
  date?: string;
  time?: string;
  weight?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  medication?: string;
  dose?: number;
  painLevel?: number;
  injectionSite?: string;
  isr?: string;
  notes?: string;
  nausea?: number;
  vomiting?: number;
  diarrhea?: number;
  constipation?: number;
  abdominalPain?: number;
  headache?: number;
  fatigue?: number;
  dizziness?: number;
  lossOfAppetite?: number;
  heartburn?: number;
  unitSystem?: 'metric' | 'imperial';
  age?: number;
  gender?: 'male' | 'female';
  height?: number;
  activityLevel?: number;
  goalWeight?: number;
  useWheelForNumbers?: boolean;
  useWheelForDate?: boolean;
  // Protocol fields with P prefix
  Pid?: string;
  Pmedication?: string;
  Pdose?: number;
  PfrequencyPerWeek?: number;
  PstartDate?: string;
  PstopDate?: string;
  PhalfLifeHours?: number;
  Pphase?: string;
  // Manual medication entries with M prefix
  Mdate?: string;
  Mtime?: string;
  Mmedication?: string;
  Mdose?: number;
  MhalfLifeHours?: number;
  MinjectionSite?: string;
  Misr?: string;
  Mnotes?: string;
  MpainLevel?: number;
  // Peptide definitions with Pep prefix
  PepId?: string;
  PepName?: string;
  PepCategory?: string;
  PepDose?: number;
  PepDoseUnit?: string;
  PepFrequency?: string;
  PepPreferredTime?: string;
  PepRoute?: string;
  PepStartDate?: string;
  PepEndDate?: string;
  PepHalfLifeHours?: number;
  PepNotes?: string;
  PepColor?: string;
  PepIsActive?: boolean;
  // Peptide log entries with PL prefix
  PLdate?: string;
  PLtime?: string;
  PLpeptideId?: string;
  PLpeptideName?: string;
  PLdose?: number;
  PLdoseUnit?: string;
  PLroute?: string;
  PLinjectionSite?: string;
  PLpainLevel?: number;
  PLnotes?: string;
}

export interface ImportPreview {
  entries: number;
  userSettings: number;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export type ImportMode = 'merge' | 'replace';

export const LBS_TO_KG = 0.453592;
export const KG_TO_LBS = 2.20462;

export const CSV_HEADER = ALL_COLUMNS.join(',');

export const SIDE_EFFECT_KEYS = new Set(SIDE_EFFECT_COLUMNS);
