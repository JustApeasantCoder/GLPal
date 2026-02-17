export type MedicationKey = 'semaglutide' | 'tirzepatide' | 'retatrutide' | 'cagrilintide';

export const CANONICAL_MEDICATIONS: Record<MedicationKey, string[]> = {
  semaglutide: ['semaglutide', 'ozempic', 'wegovy'],
  tirzepatide: ['tirzepatide', 'mounjaro', 'zepbound'],
  retatrutide: ['retatrutide'],
  cagrilintide: ['cagrilintide', 'amycretin'],
};

export const MEDICATION_KEYS: MedicationKey[] = ['semaglutide', 'tirzepatide', 'retatrutide', 'cagrilintide'];

export const normalizeMedName = (name: string): MedicationKey | null => {
  const lower = name.toLowerCase();
  
  for (const [key, variants] of Object.entries(CANONICAL_MEDICATIONS)) {
    if (variants.some(v => lower.includes(v))) {
      return key as MedicationKey;
    }
  }
  
  return null;
};

export const isMedicationMatch = (name: string, key: MedicationKey): boolean => {
  const normalized = normalizeMedName(name);
  return normalized === key;
};

export const getMedicationDisplayName = (key: MedicationKey): string => {
  const names: Record<MedicationKey, string> = {
    semaglutide: 'Semaglutide',
    tirzepatide: 'Tirzepatide',
    retatrutide: 'Retatrutide',
    cagrilintide: 'Cagrilintide',
  };
  return names[key];
};
