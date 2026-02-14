export interface Medication {
  id: string;
  name: string;
  defaultDose: number;
  halfLifeHours: number;
  titrationDoses?: number[];
}

export const SEMAGLUTIDE_TITRATION = [0.25, 0.5, 1, 2, 2.4];
export const TIRZEPATIDE_TITRATION = [2.5, 5, 7.5, 10, 12.5, 15];
export const RETATRUTIDE_TITRATION = [1, 2, 4, 6, 8, 9, 12];
export const CAGRILINTIDE_TITRATION = [0.25, 0.5, 1, 1.5, 2.4];

export const MEDICATIONS: Medication[] = [
  { id: 'semaglutide', name: 'Semaglutide (Ozempic/Wegovy)', defaultDose: 0.25, halfLifeHours: 168, titrationDoses: SEMAGLUTIDE_TITRATION },
  { id: 'tirzepatide', name: 'Tirzepatide (Mounjaro/Zepbound)', defaultDose: 2.5, halfLifeHours: 127, titrationDoses: TIRZEPATIDE_TITRATION },
  { id: 'retatrutide', name: 'Retatrutide', defaultDose: 1, halfLifeHours: 120, titrationDoses: RETATRUTIDE_TITRATION },
  { id: 'cagrilintide', name: 'Cagrilintide (Amycretin)', defaultDose: 0.25, halfLifeHours: 168, titrationDoses: CAGRILINTIDE_TITRATION },
  { id: 'liraglutide', name: 'Liraglutide (Victoza/Saxenda)', defaultDose: 3, halfLifeHours: 13 },
  { id: 'dulaglutide', name: 'Dulaglutide (Trulicity)', defaultDose: 4.5, halfLifeHours: 108 },
  { id: 'other', name: 'Custom', defaultDose: 1, halfLifeHours: 120 },
];

export const getMedicationById = (id: string): Medication | undefined => {
  return MEDICATIONS.find(m => m.id === id);
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatFrequency = (frequencyPerWeek: number): string => {
  const scheduleMap: Record<number, string> = {
    7: 'Everyday',
    3.5: 'Every 2 days',
    2.333: 'Every 3 days',
    2: 'Every 3.5 days',
    1.75: 'Every 4 days',
    1.4: 'Every 5 days',
    1.167: 'Every 6 days',
    1: 'Weekly',
    0.5: 'Every 2 weeks',
    0.333: 'Every 3 weeks',
    0.233: 'Monthly',
  };
  return scheduleMap[frequencyPerWeek] || `${frequencyPerWeek}x/week`;
};
