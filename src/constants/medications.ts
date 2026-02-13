export interface Medication {
  id: string;
  name: string;
  defaultDose: number;
  halfLifeHours: number;
}

export const MEDICATIONS: Medication[] = [
  { id: 'semaglutide', name: 'Semaglutide (Ozempic/Wegovy)', defaultDose: 2.4, halfLifeHours: 168 },
  { id: 'tirzepatide', name: 'Tirzepatide (Mounjaro/Zepbound)', defaultDose: 15, halfLifeHours: 127 },
  { id: 'retatrutide', name: 'Retatrutide', defaultDose: 12, halfLifeHours: 120 },
  { id: 'liraglutide', name: 'Liraglutide (Victoza/Saxenda)', defaultDose: 3, halfLifeHours: 13 },
  { id: 'dulaglutide', name: 'Dulaglutide (Trulicity)', defaultDose: 4.5, halfLifeHours: 108 },
  { id: 'other', name: 'Other', defaultDose: 1, halfLifeHours: 120 },
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
