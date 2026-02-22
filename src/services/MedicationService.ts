import { GLP1Entry, GLP1Protocol } from '../types';
import { CHART_DATE_FORMATS } from '../shared/utils/chartUtils';
import { 
  saveMedicationProtocols, 
  getMedicationProtocols, 
  deleteMedicationProtocol, 
  setMedicationEntries,
  getArchivedMedicationProtocols 
} from '../shared/utils/database';

export const generateDosesFromProtocols = (
  protocols: GLP1Protocol[],
  existingEntries: GLP1Entry[] = []
): GLP1Entry[] => {
  const today = new Date();
  const generatedDoses: GLP1Entry[] = [];

  protocols.forEach(prot => {
    if (prot.isArchived) return;
    
    const start = new Date(prot.startDate);
    const end = prot.stopDate ? new Date(prot.stopDate) : today;
    const intervalDays = 7 / prot.frequencyPerWeek;

    let d = new Date(start);
    while (d < end) {
      const dateStr = CHART_DATE_FORMATS.localDate(d);
      const existingEntry = existingEntries.find(e => e.date === dateStr && e.medication === prot.medication);
      if (!existingEntry) {
        generatedDoses.push({
          date: dateStr,
          medication: prot.medication,
          dose: prot.dose,
          halfLifeHours: prot.halfLifeHours,
        });
      }
      d = new Date(d.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    }
  });

  return generatedDoses;
};

export const regenerateAllDoses = (protocols: GLP1Protocol[]): GLP1Entry[] => {
  const today = new Date();
  const newDoses: GLP1Entry[] = [];
  
  protocols.forEach(prot => {
    const start = new Date(prot.startDate);
    const end = prot.stopDate ? new Date(prot.stopDate) : today;
    const intervalDays = 7 / prot.frequencyPerWeek;

    let d = new Date(start);
    while (d < end) {
      const dateStr = CHART_DATE_FORMATS.localDate(d);
      newDoses.push({
        date: dateStr,
        medication: prot.medication,
        dose: prot.dose,
        halfLifeHours: prot.halfLifeHours,
      });
      d = new Date(d.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    }
  });
  
  newDoses.sort((a, b) => a.date.localeCompare(b.date));
  return newDoses;
};

export const saveProtocol = async (
  protocol: GLP1Protocol,
  existingProtocols: GLP1Protocol[]
): Promise<GLP1Protocol[]> => {
  const existing = Array.isArray(existingProtocols) ? existingProtocols : [];
  const exists = existing.find(p => p.id === protocol.id);
  
  let updatedProtocols: GLP1Protocol[];
  if (exists) {
    updatedProtocols = existing.map(p => p.id === protocol.id ? protocol : p);
  } else {
    updatedProtocols = [...existing, protocol];
  }
  
  await saveMedicationProtocols(updatedProtocols);
  return updatedProtocols;
};

export const deleteProtocol = async (id: string, existingProtocols: GLP1Protocol[]): Promise<GLP1Protocol[]> => {
  await deleteMedicationProtocol(id);
  const updatedList = (Array.isArray(existingProtocols) ? existingProtocols : []).filter(p => p.id !== id);
  await saveMedicationProtocols(updatedList);
  
  const newDoses = regenerateAllDoses(updatedList);
  await setMedicationEntries(newDoses);
  
  return updatedList;
};

export const archiveProtocol = async (protocol: GLP1Protocol, existingProtocols: GLP1Protocol[]): Promise<GLP1Protocol[]> => {
  const updatedList = (Array.isArray(existingProtocols) ? existingProtocols : []).filter(p => p.id !== protocol.id);
  await saveMedicationProtocols(updatedList);
  
  const newDoses = regenerateAllDoses(updatedList);
  await setMedicationEntries(newDoses);
  
  return updatedList;
};

export const getActiveProtocols = async (): Promise<GLP1Protocol[]> => {
  try {
    const protocols = await getMedicationProtocols();
    return Array.isArray(protocols) ? protocols : [];
  } catch {
    return [];
  }
};
