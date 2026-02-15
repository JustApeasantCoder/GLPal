import { GLP1Entry, GLP1Protocol } from '../types';
import { saveMedicationProtocols, getMedicationProtocols, deleteMedicationProtocol, getArchivedProtocols, setMedicationEntries } from '../shared/utils/database';

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
      const dateStr = d.toISOString().split('T')[0];
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
      const dateStr = d.toISOString().split('T')[0];
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

export const saveProtocol = (
  protocol: GLP1Protocol,
  existingProtocols: GLP1Protocol[]
): GLP1Protocol[] => {
  const existing = Array.isArray(existingProtocols) ? existingProtocols : [];
  const exists = existing.find(p => p.id === protocol.id);
  
  let updatedProtocols: GLP1Protocol[];
  if (exists) {
    updatedProtocols = existing.map(p => p.id === protocol.id ? protocol : p);
  } else {
    updatedProtocols = [...existing, protocol];
  }
  
  saveMedicationProtocols(updatedProtocols);
  return updatedProtocols;
};

export const deleteProtocol = (id: string, existingProtocols: GLP1Protocol[]): GLP1Protocol[] => {
  deleteMedicationProtocol(id);
  const updatedList = (Array.isArray(existingProtocols) ? existingProtocols : []).filter(p => p.id !== id);
  saveMedicationProtocols(updatedList);
  
  const newDoses = regenerateAllDoses(updatedList);
  setMedicationEntries(newDoses);
  
  return updatedList;
};

export const archiveProtocol = (protocol: GLP1Protocol, existingProtocols: GLP1Protocol[]): GLP1Protocol[] => {
  const archived = getArchivedProtocols();
  archived.push({ ...protocol, isArchived: true });
  localStorage.setItem('glpal_medication_archived', JSON.stringify(archived));
  
  const updatedList = (Array.isArray(existingProtocols) ? existingProtocols : []).filter(p => p.id !== protocol.id);
  saveMedicationProtocols(updatedList);
  
  const newDoses = regenerateAllDoses(updatedList);
  setMedicationEntries(newDoses);
  
  return updatedList;
};

export const getActiveProtocols = (): GLP1Protocol[] => {
  const protocols = getMedicationProtocols();
  return Array.isArray(protocols) ? protocols : [];
};
