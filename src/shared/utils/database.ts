import { WeightEntry, GLP1Entry, GLP1Protocol, UserProfile, Peptide, PeptideLogEntry } from '../../types';

// localStorage-based database simulation for browser environment
const STORAGE_KEYS = {
  WEIGHT_ENTRIES: 'glpal_weight_entries',
  GLP1_ENTRIES: 'glp1_entries',
  GLP1_MANUAL_ENTRIES: 'glp1_manual_entries',
  GLP1_PROTOCOL: 'glp1_protocol',
  GLP1_ARCHIVED: 'glp1_archived',
  MEDICATION_ENTRIES: 'glpal_medication_entries',
  MEDICATION_MANUAL_ENTRIES: 'glpal_medication_manual_entries',
  MEDICATION_PROTOCOL: 'glpal_medication_protocol',
  MEDICATION_ARCHIVED: 'glpal_medication_archived',
  USER_PROFILE: 'glpal_user_profile',
  LAST_DOSES: 'glpal_last_doses',
  LAST_MEDICATION: 'glpal_last_medication',
  PEPTIDES: 'glpal_peptides',
  PEPTIDE_LOGS: 'glpal_peptide_logs',
};

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

export const initializeDatabase = (): void => {
  // Check if localStorage is available
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available in this environment');
    return;
  }
  
  // Initialize empty arrays if data doesn't exist
  if (!localStorage.getItem(STORAGE_KEYS.WEIGHT_ENTRIES)) {
    localStorage.setItem(STORAGE_KEYS.WEIGHT_ENTRIES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GLP1_ENTRIES)) {
    localStorage.setItem(STORAGE_KEYS.GLP1_ENTRIES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USER_PROFILE)) {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(null));
  }
};

// Weight entries
export const addWeightEntry = (entry: WeightEntry): void => {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return;
  }
  
  const entries = getWeightEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  // Sort by date
  entries.sort((a, b) => a.date.localeCompare(b.date));
  
  try {
    localStorage.setItem(STORAGE_KEYS.WEIGHT_ENTRIES, JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to save weight entry:', error);
  }
};

export const getWeightEntries = (): WeightEntry[] => {
  if (!isLocalStorageAvailable()) {
    return [];
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WEIGHT_ENTRIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load weight entries:', error);
    return [];
  }
};

export const deleteWeightEntry = (date: string): void => {
  const entries = getWeightEntries();
  const filtered = entries.filter(entry => entry.date !== date);
  localStorage.setItem(STORAGE_KEYS.WEIGHT_ENTRIES, JSON.stringify(filtered));
};

// Medication entries (formerly GLP-1)
export const addMedicationEntry = (entry: GLP1Entry): void => {
  const entries = getMedicationEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  entries.sort((a, b) => a.date.localeCompare(b.date));
  
  localStorage.setItem(STORAGE_KEYS.MEDICATION_ENTRIES, JSON.stringify(entries));
};

export const getMedicationEntries = (): GLP1Entry[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MEDICATION_ENTRIES);
  return data ? JSON.parse(data) : [];
};

export const deleteMedicationEntry = (date: string): void => {
  const entries = getMedicationEntries();
  const filtered = entries.filter(entry => entry.date !== date);
  localStorage.setItem(STORAGE_KEYS.MEDICATION_ENTRIES, JSON.stringify(filtered));
};

export const clearMedicationEntries = (): void => {
  localStorage.setItem(STORAGE_KEYS.MEDICATION_ENTRIES, JSON.stringify([]));
};

export const setMedicationEntries = (entries: GLP1Entry[]): void => {
  localStorage.setItem(STORAGE_KEYS.MEDICATION_ENTRIES, JSON.stringify(entries));
};

export const addMedicationGeneratedEntry = (entry: GLP1Entry): void => {
  const entries = getMedicationEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date && e.medication === entry.medication);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  entries.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(STORAGE_KEYS.MEDICATION_ENTRIES, JSON.stringify(entries));
};

export const addMedicationManualEntry = (entry: GLP1Entry): void => {
  const entries = getMedicationManualEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date && e.medication === entry.medication);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  entries.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(STORAGE_KEYS.MEDICATION_MANUAL_ENTRIES, JSON.stringify(entries));
};

export const getMedicationManualEntries = (): GLP1Entry[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MEDICATION_MANUAL_ENTRIES);
  return data ? JSON.parse(data) : [];
};

export const saveMedicationManualEntries = (entries: GLP1Entry[]): void => {
  localStorage.setItem(STORAGE_KEYS.MEDICATION_MANUAL_ENTRIES, JSON.stringify(entries));
};

export const deleteMedicationManualEntry = (date: string): void => {
  const entries = getMedicationManualEntries();
  const filtered = entries.filter(entry => entry.date !== date);
  localStorage.setItem(STORAGE_KEYS.MEDICATION_MANUAL_ENTRIES, JSON.stringify(filtered));
};

export const getAllMedicationEntries = (): GLP1Entry[] => {
  const generated = getMedicationEntries();
  const manual = getMedicationManualEntries();
  return [...generated, ...manual].sort((a, b) => a.date.localeCompare(b.date));
};

// Medication Protocol
export const saveMedicationProtocols = (protocols: GLP1Protocol[]): void => {
  localStorage.setItem(STORAGE_KEYS.MEDICATION_PROTOCOL, JSON.stringify(protocols));
};

export const getMedicationProtocols = (): GLP1Protocol[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MEDICATION_PROTOCOL);
  return data ? JSON.parse(data) : [];
};

export const addMedicationProtocol = (protocol: GLP1Protocol): void => {
  const protocols = getMedicationProtocols();
  protocols.push(protocol);
  saveMedicationProtocols(protocols);
};

export const updateMedicationProtocol = (updatedProtocol: GLP1Protocol): void => {
  const protocols = getMedicationProtocols();
  const index = protocols.findIndex(p => p.id === updatedProtocol.id);
  if (index >= 0) {
    protocols[index] = updatedProtocol;
    saveMedicationProtocols(protocols);
  }
};

export const deleteMedicationProtocol = (id: string): void => {
  const protocols = getMedicationProtocols().filter(p => p.id !== id);
  saveMedicationProtocols(protocols);
};

export const getArchivedMedicationProtocols = (): GLP1Protocol[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MEDICATION_ARCHIVED);
  return data ? JSON.parse(data) : [];
};

export const archiveMedicationProtocol = (protocol: GLP1Protocol): void => {
  deleteMedicationProtocol(protocol.id);
  const archived = getArchivedMedicationProtocols();
  archived.push({ ...protocol, isArchived: true });
  localStorage.setItem(STORAGE_KEYS.MEDICATION_ARCHIVED, JSON.stringify(archived));
};

export const deleteArchivedMedicationProtocol = (id: string): void => {
  const archived = getArchivedMedicationProtocols().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.MEDICATION_ARCHIVED, JSON.stringify(archived));
};

export const clearMedicationProtocol = (): void => {
  localStorage.removeItem(STORAGE_KEYS.MEDICATION_PROTOCOL);
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
export const deleteArchivedProtocol = deleteArchivedMedicationProtocol;
export const clearGLP1Protocol = clearMedicationProtocol;

// User profile
export const saveUserProfile = (profile: UserProfile): void => {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
};

export const getUserProfile = (): UserProfile | null => {
  const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : null;
};

export const closeDatabase = (): void => {
  // No-op for localStorage
};

export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.WEIGHT_ENTRIES);
  localStorage.removeItem(STORAGE_KEYS.GLP1_ENTRIES);
  localStorage.removeItem(STORAGE_KEYS.GLP1_MANUAL_ENTRIES);
  localStorage.removeItem(STORAGE_KEYS.GLP1_PROTOCOL);
  localStorage.removeItem(STORAGE_KEYS.MEDICATION_ENTRIES);
  localStorage.removeItem(STORAGE_KEYS.MEDICATION_MANUAL_ENTRIES);
  localStorage.removeItem(STORAGE_KEYS.MEDICATION_PROTOCOL);
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  localStorage.removeItem('usedMedications');
  localStorage.removeItem('protocolDurationDays');
  localStorage.removeItem('latestDoseDone');
  initializeDatabase();
};

export const getLastDoses = (): Record<string, number> => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_DOSES);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const saveLastDose = (medicationId: string, dose: number): void => {
  const lastDoses = getLastDoses();
  lastDoses[medicationId] = dose;
  localStorage.setItem(STORAGE_KEYS.LAST_DOSES, JSON.stringify(lastDoses));
};

export const getLastMedication = (): string => {
  return localStorage.getItem(STORAGE_KEYS.LAST_MEDICATION) || '';
};

export const saveLastMedication = (medicationId: string): void => {
  localStorage.setItem(STORAGE_KEYS.LAST_MEDICATION, medicationId);
};

// ============================================
// PEPTIDE DATABASE FUNCTIONS
// ============================================

export const getPeptides = (): Peptide[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PEPTIDES);
  return data ? JSON.parse(data) : [];
};

export const savePeptides = (peptides: Peptide[]): void => {
  localStorage.setItem(STORAGE_KEYS.PEPTIDES, JSON.stringify(peptides));
};

export const addPeptide = (peptide: Peptide): void => {
  const peptides = getPeptides();
  peptides.push(peptide);
  savePeptides(peptides);
};

export const updatePeptide = (updatedPeptide: Peptide): void => {
  const peptides = getPeptides();
  const index = peptides.findIndex(p => p.id === updatedPeptide.id);
  if (index !== -1) {
    peptides[index] = { ...updatedPeptide, updatedAt: new Date().toISOString() };
    savePeptides(peptides);
  }
};

export const deletePeptide = (id: string): void => {
  const peptides = getPeptides().filter(p => p.id !== id);
  savePeptides(peptides);
  // Also delete all logs for this peptide
  const logs = getPeptideLogs().filter(l => l.peptideId !== id);
  savePeptideLogs(logs);
};

export const getActivePeptides = (): Peptide[] => {
  return getPeptides().filter(p => p.isActive && !p.isArchived);
};

export const getArchivedPeptides = (): Peptide[] => {
  return getPeptides().filter(p => p.isArchived);
};

// Peptide Log Entries
export const getPeptideLogs = (): PeptideLogEntry[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PEPTIDE_LOGS);
  return data ? JSON.parse(data) : [];
};

export const savePeptideLogs = (logs: PeptideLogEntry[]): void => {
  localStorage.setItem(STORAGE_KEYS.PEPTIDE_LOGS, JSON.stringify(logs));
};

export const addPeptideLog = (log: PeptideLogEntry): void => {
  const logs = getPeptideLogs();
  logs.push(log);
  savePeptideLogs(logs);
};

export const deletePeptideLog = (id: string): void => {
  const logs = getPeptideLogs().filter(l => l.id !== id);
  savePeptideLogs(logs);
};

export const getPeptideLogsById = (peptideId: string): PeptideLogEntry[] => {
  return getPeptideLogs()
    .filter(l => l.peptideId === peptideId)
    .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
};

export const getLatestPeptideLog = (peptideId: string): PeptideLogEntry | null => {
  const logs = getPeptideLogsById(peptideId);
  return logs.length > 0 ? logs[0] : null;
};

export const clearPeptideData = (): void => {
  localStorage.setItem(STORAGE_KEYS.PEPTIDES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PEPTIDE_LOGS, JSON.stringify([]));
};