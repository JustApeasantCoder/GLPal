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
