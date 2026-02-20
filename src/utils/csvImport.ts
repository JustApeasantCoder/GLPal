import { CsvRow, ImportPreview, LBS_TO_KG, ALL_COLUMNS, SIDE_EFFECT_KEYS } from './csvTypes';
import { WeightEntry, WeightMacros, GLP1Entry, UserProfile, SideEffect } from '../types';
// import { normalizeMedName } from '../shared/utils/medicationUtils';

const unescapeCsvValue = (value: string): string => {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/""/g, '"');
  }
  return value;
};

const parseBoolean = (value: string): boolean | undefined => {
  if (!value || value === '') return undefined;
  const lower = value.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;
  return undefined;
};

const parseNumberWithUnit = (value: string): number | undefined => {
  if (!value || value === '') return undefined;
  const cleaned = value.toLowerCase().replace(/[,\s]/g, '');
  const numMatch = cleaned.match(/^([+-]?\d*\.?\d+)/);
  if (!numMatch) return undefined;
  const num = parseFloat(numMatch[1]);
  return isNaN(num) ? undefined : num;
};

const COLUMN_ALIASES: Record<string, string[]> = {
  date: ['date', 'day', 'timestamp', 'datetime', 'record_date'],
  time: ['time', 'timestamp', 'hour', 'datetime'],
  medication: ['medication', 'med', 'drug', 'medicine', 'med_name', 'medication_name', 'product', 'name'],
  dose: ['dose', 'dosage', 'amount', 'medication_dose', 'medication_dosage', 'units', 'quantity'],
  painLevel: ['pain', 'pain_level', 'painlevel', 'pain_lvl', 'lvl'],
  injectionSite: ['injection_site', 'injectionsite', 'site', 'inject_site', 'location', 'body_site'],
  isr: ['isr', 'reaction', 'injection_reaction', 'site_reaction', 'ir', 'injection_response'],
  weight: ['weight', 'body_weight', 'bw', 'bodyweight', 'body weight'],
  calories: ['calories', 'cal', 'kcal', 'energy', 'energy_intake'],
  protein: ['protein', 'prot', 'protein_g', 'proteins'],
  carbs: ['carbs', 'carbohydrate', 'carb', 'carbs_g', 'carbohydrates'],
  fat: ['fat', 'fats', 'fat_g', 'dietary_fat'],
  notes: ['notes', 'note', 'comment', 'comments', 'observation', 'description'],
  unitSystem: ['unit_system', 'unitsystem', 'unit', 'units', 'measurement_system'],
  age: ['age', 'patient_age'],
  gender: ['gender', 'sex', 'patient_gender'],
  height: ['height', 'ht', 'body_height'],
  activityLevel: ['activity_level', 'activitylevel', 'activity', 'pal'],
  goalWeight: ['goal_weight', 'target_weight', 'target'],
  useWheelForNumbers: ['usewheelfornumbers', 'wheel_numbers'],
  useWheelForDate: ['usewheelfordate', 'wheel_date'],
  nausea: ['nausea', 'nauseous'],
  vomiting: ['vomiting', 'vomit'],
  diarrhea: ['diarrhea', 'loose_stools'],
  constipation: ['constipation', 'constipated'],
  abdominalPain: ['abdominal_pain', 'abdominalpain', 'stomach_pain', 'stomachache', 'belly_pain'],
  headache: ['headache', 'head ache', 'head pain'],
  fatigue: ['fatigue', 'tired', 'tiredness', 'exhaustion'],
  dizziness: ['dizziness', 'dizzy', 'lightheaded'],
  lossOfAppetite: ['loss_of_appetite', 'loss_of_appetite', 'no_appetite', 'appetite_loss', 'decreased_appetite'],
  heartburn: ['heartburn', 'acid_reflux', 'indigestion'],
};

const normalizeColumnName = (header: string): string | null => {
  const originalHeader = header.trim();
  const normalized = originalHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // First try exact match with standard column names
  for (const col of ALL_COLUMNS) {
    const colNormalized = col.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (colNormalized === normalized) {
      return col;
    }
  }
  
  // Then try exact match in COLUMN_ALIASES
  for (const [standard, aliases] of Object.entries(COLUMN_ALIASES)) {
    const standardNormalized = standard.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (standardNormalized === normalized) return standard;
    
    // Check for exact alias matches
    for (const alias of aliases) {
      const aliasNormalized = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (aliasNormalized === normalized) {
        return standard;
      }
    }
    
    // More lenient matching for aliases (contains check) - but be more careful
    for (const alias of aliases) {
      const aliasNormalized = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      // Only match if the normalized header contains the full alias or vice versa
      // and the lengths are reasonably close to avoid false positives
      if (normalized.includes(aliasNormalized) && aliasNormalized.length > 3) {
        return standard;
      }
      if (aliasNormalized.includes(normalized) && normalized.length > 3) {
        return standard;
      }
    }
  }
  
  return null;
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(unescapeCsvValue(current));
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(unescapeCsvValue(current));
  return result;
};

export const parseCsv = (content: string): CsvRow[] => {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  
  const rawHeaders = lines[0].split(',').map(h => h.trim());
  const headerMap: Record<number, string> = {};
  
  rawHeaders.forEach((h, idx) => {
    const normalized = normalizeColumnName(h);
    if (normalized) {
      headerMap[idx] = normalized;
    }
  });
  
  const rows: CsvRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCsvLine(line);
    if (values.length !== rawHeaders.length) continue;
    
    const row: any = {};
    
    Object.entries(headerMap).forEach(([idx, standardName]) => {
      const value = values[parseInt(idx)];
      
      switch (standardName) {
        case 'date':
        case 'time':
        case 'medication':
        case 'injectionSite':
        case 'isr':
        case 'notes':
        case 'unitSystem':
        case 'gender':
          row[standardName] = value || undefined;
          break;
        case 'weight':
        case 'calories':
        case 'protein':
        case 'carbs':
        case 'fat':
        case 'dose':
        case 'painLevel':
        case 'age':
        case 'height':
        case 'activityLevel':
        case 'goalWeight':
          row[standardName] = parseNumberWithUnit(value);
          break;
        case 'useWheelForNumbers':
        case 'useWheelForDate':
          row[standardName] = parseBoolean(value);
          break;
      }
    });
    
    if (row.weight !== undefined) {
      // Smart weight unit conversion
      // If unitSystem is specified in the row and it's 'metric', assume KG (no conversion)
      // If unitSystem is 'imperial' or not specified, convert from LBS to KG
      // Heuristic: if weight > 200, it's likely in LBS and needs conversion
      const shouldConvert = !row.unitSystem || row.unitSystem === 'imperial' || row.weight > 200;
      row.weight = shouldConvert ? row.weight * LBS_TO_KG : row.weight;
    }
    
    if (row.date) {
      rows.push(row as CsvRow);
    } else if (row.age !== undefined || row.gender || row.height || row.unitSystem) {
      rows.push(row as CsvRow);
    }
  }
  
  return rows;
};

export const generateImportPreview = (rows: CsvRow[]): ImportPreview => {
  const preview: ImportPreview = {
    entries: 0,
    userSettings: 0,
  };
  
  rows.forEach(row => {
    if (row.date) {
      preview.entries++;
    } else if (row.age !== undefined || row.gender || row.height || row.unitSystem) {
      preview.userSettings++;
    }
  });
  
  return preview;
};

export const normalizeMedicationName = (name: string): string => {
  // Preserve the original formatting including parentheses and brand names
  // Only use normalizeMedName for internal matching, not for display
  return name.trim();
};

export const extractDoseFromMedication = (name: string): number | undefined => {
  const doseMatch = name.match(/(\d+\.?\d*)\s*(mg|mcg|ml|iu|g)?/i);
  if (doseMatch) {
    return parseFloat(doseMatch[1]);
  }
  return undefined;
};

export const convertToWeightEntry = (row: CsvRow): WeightEntry | null => {
  if (!row.date || (row.weight === undefined && row.calories === undefined && row.protein === undefined)) {
    return null;
  }
  
  const macros: WeightMacros | undefined = row.calories !== undefined || row.protein !== undefined 
    ? {
        calories: row.calories || 0,
        protein: row.protein || 0,
        carbs: row.carbs || 0,
        fat: row.fat || 0,
      }
    : undefined;
  
  return {
    date: row.date,
    weight: row.weight || 0,
    notes: row.notes,
    macros: macros?.calories || macros?.protein || macros?.carbs || macros?.fat ? macros : undefined,
  };
};

export const convertToDoseEntry = (row: CsvRow): GLP1Entry | null => {
  if (!row.date || !row.medication) return null;
  
  const extractedDose = row.dose ?? extractDoseFromMedication(row.medication);
  
  const sideEffects: SideEffect[] = [];
  SIDE_EFFECT_KEYS.forEach(se => {
    const severity = (row as any)[se];
    if (severity !== undefined && severity > 0) {
      const name = se.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      sideEffects.push({ name, severity });
    }
  });
  
  return {
    date: row.date,
    time: row.time,
    medication: normalizeMedicationName(row.medication),
    dose: extractedDose || 0,
    halfLifeHours: 168,
    painLevel: row.painLevel,
    injectionSite: row.injectionSite,
    isr: row.isr,
    sideEffects: sideEffects.length > 0 ? sideEffects : undefined,
    notes: row.notes,
  };
};

export const convertToUserProfile = (row: CsvRow): UserProfile | null => {
  if (!row.age && !row.gender && !row.height && !row.unitSystem) return null;
  
  return {
    unitSystem: row.unitSystem || 'metric',
    age: row.age || 0,
    gender: row.gender || 'male',
    height: row.height || 0,
    activityLevel: row.activityLevel || 1,
    goalWeight: row.goalWeight,
    useWheelForNumbers: row.useWheelForNumbers,
    useWheelForDate: row.useWheelForDate,
  };
};

export const hasData = (row: CsvRow): boolean => {
  return !!(row.date || row.age || row.gender || row.height || row.unitSystem);
};
