import { WeightEntry, GLP1Entry, GLP1Protocol, UserProfile, Peptide, PeptideLogEntry, MedicationStorage, DailyLogEntry } from '../../types';
import { db, clearDatabase } from '../../db/dexie';

const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    await db.open();
  } catch (error) {
    console.error('Failed to open database:', error);
  }
};

export const clearAllData = async (): Promise<void> => {
  await clearDatabase();
  await initializeDatabase();
  localStorage.removeItem('glpal_last_doses');
  localStorage.removeItem('glpal_last_medication');
  localStorage.removeItem('glpal_dosage_calculator');
  localStorage.removeItem('glpal_custom_medications');
  localStorage.removeItem('usedMedications');
  localStorage.removeItem('protocolDurationDays');
  localStorage.removeItem('lastLoggedDate');
  localStorage.removeItem('lastLoggedProtocolId');
  localStorage.removeItem('glpal_dose_log_collapsed');
  localStorage.removeItem('glpal_weight_log_collapsed');
  localStorage.removeItem('glpal_peptide_log_collapsed');
  localStorage.removeItem('glpal_expanded_peptide_card');
  localStorage.removeItem('glpal_disclaimer_acknowledged');
  localStorage.removeItem('glpal_sim_offset');
};

// Weight entries
export const addWeightEntry = async (entry: WeightEntry): Promise<void> => {
  const entries = await getWeightEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  entries.sort((a, b) => a.date.localeCompare(b.date));
  await db.weights.bulkPut(entries);
};

export const getWeightEntries = async (): Promise<WeightEntry[]> => {
  try {
    const entries = await db.weights.toArray();
    return entries.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
};

export const deleteWeightEntry = async (date: string): Promise<void> => {
  await db.weights.delete(date);
};

export const saveWeightEntries = async (entries: WeightEntry[]): Promise<void> => {
  entries.sort((a, b) => a.date.localeCompare(b.date));
  await db.weights.bulkPut(entries);
};

// Medication entries (generated)
export const addMedicationEntry = async (entry: GLP1Entry): Promise<void> => {
  const entries = await getMedicationEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  entries.sort((a, b) => a.date.localeCompare(b.date));
  await db.medications.bulkPut(entries);
};

export const getMedicationEntries = async (): Promise<GLP1Entry[]> => {
  try {
    const entries = await db.medications.toArray();
    return entries.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
};

export const deleteMedicationEntry = async (date: string): Promise<void> => {
  await db.medications.delete(date);
};

export const clearMedicationEntries = async (): Promise<void> => {
  await db.medications.clear();
};

export const setMedicationEntries = async (newEntries: GLP1Entry[]): Promise<void> => {
  const existingEntries = await getMedicationEntries();
  
  for (const newEntry of newEntries) {
    const existingIndex = existingEntries.findIndex(
      e => e.date === newEntry.date && e.medication === newEntry.medication
    );
    
    if (existingIndex >= 0) {
      existingEntries[existingIndex] = newEntry;
    } else {
      existingEntries.push(newEntry);
    }
  }
  
  existingEntries.sort((a, b) => a.date.localeCompare(b.date));
  await db.medications.bulkPut(existingEntries);
};

export const addMedicationGeneratedEntry = async (entry: GLP1Entry): Promise<void> => {
  const entries = await getMedicationEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date && e.medication === entry.medication);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  entries.sort((a, b) => a.date.localeCompare(b.date));
  await db.medications.bulkPut(entries);
};

// Medication Manual entries
export const addMedicationManualEntry = async (entry: GLP1Entry): Promise<void> => {
  const entries = await getMedicationEntries();
  const entryWithManualFlag = { ...entry, isManual: true };
  const existingIndex = entries.findIndex(e => e.date === entry.date && e.medication === entry.medication);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entryWithManualFlag;
  } else {
    entries.push(entryWithManualFlag);
  }
  
  entries.sort((a, b) => a.date.localeCompare(b.date));
  await db.medications.bulkPut(entries);
};

export const getMedicationManualEntries = async (): Promise<GLP1Entry[]> => {
  try {
    const entries = await db.medications.toArray();
    return entries.filter(e => e.isManual).map(e => ({ ...e, isManual: true }));
  } catch {
    return [];
  }
};

export const saveMedicationManualEntries = async (entries: GLP1Entry[]): Promise<void> => {
  const allEntries = await getMedicationEntries();
  const manualEntries = entries.map(e => ({ ...e, isManual: true }));
  
  const nonManual = allEntries.filter(e => !e.isManual);
  const merged = [...nonManual, ...manualEntries];
  merged.sort((a, b) => a.date.localeCompare(b.date));
  
  await db.medications.bulkPut(merged);
};

export const deleteMedicationManualEntry = async (date: string): Promise<void> => {
  await db.weights.delete(date);
};

export const getAllMedicationEntries = async (): Promise<GLP1Entry[]> => {
  return getMedicationEntries();
};

// Medication Protocols
export const saveMedicationProtocols = async (protocols: GLP1Protocol[]): Promise<void> => {
  await db.protocols.bulkPut(protocols);
};

export const getMedicationProtocols = async (): Promise<GLP1Protocol[]> => {
  try {
    const protocols = await db.protocols.toArray();
    return protocols.sort((a, b) => a.startDate.localeCompare(b.startDate));
  } catch {
    return [];
  }
};

export const addMedicationProtocol = async (protocol: GLP1Protocol): Promise<void> => {
  const protocols = await getMedicationProtocols();
  protocols.push(protocol);
  await saveMedicationProtocols(protocols);
};

export const updateMedicationProtocol = async (updatedProtocol: GLP1Protocol): Promise<void> => {
  await db.protocols.put(updatedProtocol);
};

export const deleteMedicationProtocol = async (id: string): Promise<void> => {
  await db.protocols.delete(id);
};

export const deleteMedicationProtocols = async (ids: string[]): Promise<void> => {
  await db.protocols.bulkDelete(ids);
};

export const getArchivedMedicationProtocols = async (): Promise<GLP1Protocol[]> => {
  return [];
};

export const archiveMedicationProtocol = async (protocol: GLP1Protocol): Promise<void> => {
  const archivedProtocol = { ...protocol, isArchived: true };
  await db.protocols.put(archivedProtocol);
};

// User profile
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  await db.userProfile.put(profile);
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const profiles = await db.userProfile.toArray();
    return profiles.length > 0 ? profiles[0] : null;
  } catch {
    return null;
  }
};

// Last doses (stored in localStorage for simplicity)
export const getLastDoses = (): Record<string, number> => {
  if (!isLocalStorageAvailable()) return {};
  try {
    const data = localStorage.getItem('glpal_last_doses');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const saveLastDose = (medicationId: string, dose: number): void => {
  if (!isLocalStorageAvailable()) return;
  const lastDoses = getLastDoses();
  lastDoses[medicationId] = dose;
  localStorage.setItem('glpal_last_doses', JSON.stringify(lastDoses));
};

export const getLastMedication = (): string => {
  if (!isLocalStorageAvailable()) return '';
  return localStorage.getItem('glpal_last_medication') || '';
};

export const saveLastMedication = (medicationId: string): void => {
  if (!isLocalStorageAvailable()) return;
  localStorage.setItem('glpal_last_medication', medicationId);
};

export const getCustomMedications = (): string[] => {
  if (!isLocalStorageAvailable()) return [];
  const stored = localStorage.getItem('glpal_custom_medications');
  return stored ? JSON.parse(stored) : [];
};

export const saveCustomMedication = (name: string): void => {
  if (!isLocalStorageAvailable()) return;
  const existing = getCustomMedications();
  if (!existing.includes(name)) {
    const updated = [name, ...existing].slice(0, 10);
    localStorage.setItem('glpal_custom_medications', JSON.stringify(updated));
  }
};

// Peptides
export const getPeptides = async (): Promise<Peptide[]> => {
  try {
    return await db.peptides.toArray();
  } catch {
    return [];
  }
};

export const savePeptides = async (peptides: Peptide[]): Promise<void> => {
  await db.peptides.bulkPut(peptides);
};

export const addPeptide = async (peptide: Peptide): Promise<void> => {
  const peptides = await getPeptides();
  peptides.push(peptide);
  await db.peptides.bulkPut(peptides);
};

export const updatePeptide = async (updatedPeptide: Peptide): Promise<void> => {
  await db.peptides.put(updatedPeptide);
};

export const deletePeptide = async (id: string): Promise<void> => {
  await db.peptides.delete(id);
  await db.peptideLogs.where('peptideId').equals(id).delete();
};

export const getActivePeptides = async (): Promise<Peptide[]> => {
  const peptides = await getPeptides();
  return peptides.filter(p => p.isActive && !p.isArchived);
};

// Peptide Logs
export const getPeptideLogs = async (): Promise<PeptideLogEntry[]> => {
  try {
    const logs = await db.peptideLogs.toArray();
    return logs.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
  } catch {
    return [];
  }
};

export const savePeptideLogs = async (logs: PeptideLogEntry[]): Promise<void> => {
  await db.peptideLogs.bulkPut(logs);
};

export const addPeptideLog = async (log: PeptideLogEntry): Promise<void> => {
  await db.peptideLogs.put(log);
};

export const deletePeptideLog = async (id: string): Promise<void> => {
  await db.peptideLogs.delete(id);
};

export const getPeptideLogsById = async (peptideId: string): Promise<PeptideLogEntry[]> => {
  try {
    const logs = await db.peptideLogs.where('peptideId').equals(peptideId).toArray();
    return logs.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
  } catch {
    return [];
  }
};

export const clearPeptideData = async (): Promise<void> => {
  await db.peptides.clear();
  await db.peptideLogs.clear();
};

// Medication Storage
export const getMedicationStorage = async (): Promise<MedicationStorage[]> => {
  try {
    return await db.medicationStorage.toArray();
  } catch {
    return [];
  }
};

export const saveMedicationStorage = async (items: MedicationStorage[]): Promise<void> => {
  await db.medicationStorage.bulkPut(items);
};

export const addMedicationStorage = async (item: MedicationStorage): Promise<void> => {
  const items = await getMedicationStorage();
  items.push(item);
  await db.medicationStorage.bulkPut(items);
};

export const updateMedicationStorage = async (updatedItem: MedicationStorage): Promise<void> => {
  await db.medicationStorage.put(updatedItem);
};

export const deleteMedicationStorage = async (id: string): Promise<void> => {
  await db.medicationStorage.delete(id);
};

export const getActiveMedicationStorage = async (): Promise<MedicationStorage[]> => {
  const items = await getMedicationStorage();
  return items.filter(item => item.isActive);
};

// Daily Logs
export const getDailyLogs = async (): Promise<DailyLogEntry[]> => {
  try {
    const entries = await db.dailyLogs.toArray();
    return entries.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
};

export const saveDailyLogs = async (entries: DailyLogEntry[]): Promise<void> => {
  entries.sort((a, b) => a.date.localeCompare(b.date));
  await db.dailyLogs.bulkPut(entries);
};

export const addDailyLog = async (entry: DailyLogEntry): Promise<void> => {
  await db.dailyLogs.put(entry);
};

export const deleteDailyLog = async (date: string): Promise<void> => {
  await db.dailyLogs.delete(date);
};

// Dosage Calculator (localStorage)
export interface DosageCalculatorData {
  vialStrength: string;
  waterAmount: string;
  desiredDose: string;
  syringeDraw: string;
}

export const getDosageCalculatorData = (): DosageCalculatorData | null => {
  if (!isLocalStorageAvailable()) return null;
  try {
    const data = localStorage.getItem('glpal_dosage_calculator');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveDosageCalculatorData = (data: DosageCalculatorData): void => {
  if (!isLocalStorageAvailable()) return;
  localStorage.setItem('glpal_dosage_calculator', JSON.stringify(data));
};

export const clearDosageCalculatorData = (): void => {
  if (!isLocalStorageAvailable()) return;
  localStorage.removeItem('glpal_dosage_calculator');
};

// Backward compatibility aliases
export const addGLP1Entry = addMedicationEntry;
export const getGLP1Entries = getMedicationEntries;
export const deleteGLP1Entry = deleteMedicationEntry;
export const clearGLP1Entries = clearMedicationEntries;
export const setGLP1Entries = setMedicationEntries;
export const addGLP1GeneratedEntry = addMedicationGeneratedEntry;
export const addGLP1ManualEntry = addMedicationManualEntry;
export const getGLP1ManualEntries = getMedicationManualEntries;
export const deleteGLP1ManualEntry = deleteMedicationManualEntry;
export const getAllGLP1Entries = getAllMedicationEntries;
export const saveGLP1Protocols = saveMedicationProtocols;
export const getGLP1Protocols = getMedicationProtocols;
export const addGLP1Protocol = addMedicationProtocol;
export const updateGLP1Protocol = updateMedicationProtocol;
export const deleteGLP1Protocol = deleteMedicationProtocol;
export const getArchivedProtocols = getArchivedMedicationProtocols;
export const archiveProtocol = archiveMedicationProtocol;
