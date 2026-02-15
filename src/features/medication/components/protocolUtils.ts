import { GLP1Protocol } from '../../../types';
import { MEDICATIONS, Medication } from '../../../constants/medications';
import { timeService } from '../../../core/timeService';

export interface ProtocolFormState {
  selectedMedication: string;
  dose: string;
  frequency: string;
  startDate: string;
  stopDate: string;
  continuationInfo: string | null;
  phase: 'titrate' | 'maintenance' | undefined;
}

export const getTodayString = (): string => {
  return new Date(timeService.now()).toISOString().split('T')[0];
};

export const calculateStopDate = (startDate: string, days: number): string => {
  if (!startDate) return '';
  const date = new Date(startDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const getDefaultDurationDays = (): number => {
  const saved = localStorage.getItem('protocolDurationDays');
  return saved ? parseInt(saved, 10) : 28;
};

export const saveDurationDays = (days: number): void => {
  localStorage.setItem('protocolDurationDays', days.toString());
};

export const getSavedMedications = (): string[] => {
  const saved = localStorage.getItem('usedMedications');
  return saved ? JSON.parse(saved) : [];
};

export const saveMedication = (name: string): void => {
  const current = getSavedMedications();
  if (!current.includes(name)) {
    const updated = [...current, name];
    localStorage.setItem('usedMedications', JSON.stringify(updated));
  }
};

export const getAllMedicationIds = (savedMeds: string[]): string[] => {
  const mainIds = ['semaglutide', 'tirzepatide', 'retatrutide'];
  const otherMeds = savedMeds.filter(name => 
    !['Semaglutide (Ozempic/Wegovy)', 'Tirzepatide (Mounjaro/Zepbound)', 'Retatrutide'].includes(name)
  );
  const otherIds = otherMeds.map(name => {
    const med = MEDICATIONS.find(m => m.name === name);
    return med ? med.id : null;
  }).filter(Boolean) as string[];
  
  return [...mainIds, 'other', ...otherIds];
};

export const filterMainMedications = (allIds: string[]): Medication[] => {
  return MEDICATIONS.filter(m => {
    return allIds.includes(m.id);
  }).map(med => {
    if (med.id === 'other') {
      return { ...med, name: 'More Options' };
    }
    return med;
  });
};

export interface LastProtocolInfo {
  lastEndDate: string;
  lastDose: number;
  isOngoing: boolean;
}

export const getLastProtocolForMed = (
  medicationId: string,
  existingProtocols: GLP1Protocol[]
): LastProtocolInfo | null => {
  const med = MEDICATIONS.find(m => m.id === medicationId);
  if (!med) return null;

  const medProtocols = existingProtocols
    .filter(p => p.medication === med.name || p.medication === medicationId);
  
  if (medProtocols.length === 0) return null;

  const sorted = [...medProtocols].sort((a, b) => {
    if (!a.stopDate) return 1;
    if (!b.stopDate) return -1;
    return new Date(b.stopDate).getTime() - new Date(a.stopDate).getTime();
  });

  const lastProtocol = sorted[0];
  return {
    lastEndDate: lastProtocol.stopDate || '',
    lastDose: lastProtocol.dose,
    isOngoing: !lastProtocol.stopDate,
  };
};

export const getNextTitrationDose = (
  medicationId: string,
  lastDose: number
): number | null => {
  const med = MEDICATIONS.find(m => m.id === medicationId);
  if (!med?.titrationDoses) return null;

  const lastDoseIndex = med.titrationDoses.indexOf(lastDose);
  if (lastDoseIndex >= 0 && lastDoseIndex < med.titrationDoses.length - 1) {
    return med.titrationDoses[lastDoseIndex + 1];
  }
  return null;
};

export const createProtocolFromState = (
  state: ProtocolFormState,
  existingProtocol?: GLP1Protocol | null
): GLP1Protocol => {
  const med = MEDICATIONS.find(m => m.id === state.selectedMedication);
  
  let medicationName = state.selectedMedication;
  let halfLife = 120;
  
  if (state.selectedMedication.startsWith('custom:')) {
    medicationName = state.selectedMedication.replace('custom:', '');
  } else if (med) {
    medicationName = med.name;
    halfLife = med.halfLifeHours;
  }

  const stopDateValue = state.stopDate 
    ? state.stopDate 
    : new Date(new Date(state.startDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    id: existingProtocol?.id || generateId(),
    medication: medicationName,
    dose: parseFloat(state.dose),
    frequencyPerWeek: parseInt(state.frequency),
    startDate: state.startDate,
    stopDate: stopDateValue,
    halfLifeHours: halfLife,
    phase: state.phase,
  };
};

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const frequencyOptions = [
  { value: '7', label: 'Everyday' },
  { value: '3.5', label: 'Every 2 Days' },
  { value: '2.333', label: 'Every 3 Days' },
  { value: '2', label: 'Every 3.5 Days' },
  { value: '1.75', label: 'Every 4 Days' },
  { value: '1.4', label: 'Every 5 Days' },
  { value: '1.167', label: 'Every 6 Days' },
  { value: '1', label: 'Every Week' },
  { value: '0.5', label: 'Every 2 Weeks' },
  { value: '0.333', label: 'Every 3 Weeks' },
  { value: '0.233', label: 'Every Month' },
];

export const durationPresets = [
  { label: '1W', days: 7 },
  { label: '2W', days: 14 },
  { label: '1M', days: 28 },
  { label: '1Y', days: 336 },
];
