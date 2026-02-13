import { WeightEntry, GLP1Entry, GLP1Protocol, UserProfile } from '../types';

// localStorage-based database simulation for browser environment
const STORAGE_KEYS = {
  WEIGHT_ENTRIES: 'glpal_weight_entries',
  GLP1_ENTRIES: 'glp1_entries',
  GLP1_MANUAL_ENTRIES: 'glp1_manual_entries',
  GLP1_PROTOCOL: 'glp1_protocol',
  GLP1_ARCHIVED: 'glp1_archived',
  USER_PROFILE: 'glpal_user_profile',
  LAST_DOSES: 'glpal_last_doses',
  LAST_MEDICATION: 'glpal_last_medication',
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

// GLP-1 entries
export const addGLP1Entry = (entry: GLP1Entry): void => {
  const entries = getGLP1Entries();
  const existingIndex = entries.findIndex(e => e.date === entry.date);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  // Sort by date
  entries.sort((a, b) => a.date.localeCompare(b.date));
  
  localStorage.setItem(STORAGE_KEYS.GLP1_ENTRIES, JSON.stringify(entries));
};

export const getGLP1Entries = (): GLP1Entry[] => {
  const data = localStorage.getItem(STORAGE_KEYS.GLP1_ENTRIES);
  return data ? JSON.parse(data) : [];
};

export const deleteGLP1Entry = (date: string): void => {
  const entries = getGLP1Entries();
  const filtered = entries.filter(entry => entry.date !== date);
  localStorage.setItem(STORAGE_KEYS.GLP1_ENTRIES, JSON.stringify(filtered));
};

export const clearGLP1Entries = (): void => {
  localStorage.setItem(STORAGE_KEYS.GLP1_ENTRIES, JSON.stringify([]));
};

export const setGLP1Entries = (entries: GLP1Entry[]): void => {
  localStorage.setItem(STORAGE_KEYS.GLP1_ENTRIES, JSON.stringify(entries));
};

export const addGLP1GeneratedEntry = (entry: GLP1Entry): void => {
  const entries = getGLP1Entries();
  const existingIndex = entries.findIndex(e => e.date === entry.date && e.medication === entry.medication);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  entries.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(STORAGE_KEYS.GLP1_ENTRIES, JSON.stringify(entries));
};

export const addGLP1ManualEntry = (entry: GLP1Entry): void => {
  const entries = getGLP1ManualEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date && e.medication === entry.medication);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  entries.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(STORAGE_KEYS.GLP1_MANUAL_ENTRIES, JSON.stringify(entries));
};

export const getGLP1ManualEntries = (): GLP1Entry[] => {
  const data = localStorage.getItem(STORAGE_KEYS.GLP1_MANUAL_ENTRIES);
  return data ? JSON.parse(data) : [];
};

export const deleteGLP1ManualEntry = (date: string): void => {
  const entries = getGLP1ManualEntries();
  const filtered = entries.filter(entry => entry.date !== date);
  localStorage.setItem(STORAGE_KEYS.GLP1_MANUAL_ENTRIES, JSON.stringify(filtered));
};

export const getAllGLP1Entries = (): GLP1Entry[] => {
  const generated = getGLP1Entries();
  const manual = getGLP1ManualEntries();
  return [...generated, ...manual].sort((a, b) => a.date.localeCompare(b.date));
};

// GLP-1 Protocol (array of protocols)
export const saveGLP1Protocols = (protocols: GLP1Protocol[]): void => {
  localStorage.setItem(STORAGE_KEYS.GLP1_PROTOCOL, JSON.stringify(protocols));
};

export const getGLP1Protocols = (): GLP1Protocol[] => {
  const data = localStorage.getItem(STORAGE_KEYS.GLP1_PROTOCOL);
  return data ? JSON.parse(data) : [];
};

export const addGLP1Protocol = (protocol: GLP1Protocol): void => {
  const protocols = getGLP1Protocols();
  protocols.push(protocol);
  saveGLP1Protocols(protocols);
};

export const updateGLP1Protocol = (updatedProtocol: GLP1Protocol): void => {
  const protocols = getGLP1Protocols();
  const index = protocols.findIndex(p => p.id === updatedProtocol.id);
  if (index >= 0) {
    protocols[index] = updatedProtocol;
    saveGLP1Protocols(protocols);
  }
};

export const deleteGLP1Protocol = (id: string): void => {
  const protocols = getGLP1Protocols().filter(p => p.id !== id);
  saveGLP1Protocols(protocols);
};

// Archived protocols (moved from active when user clicks Archive)
export const getArchivedProtocols = (): GLP1Protocol[] => {
  const data = localStorage.getItem(STORAGE_KEYS.GLP1_ARCHIVED);
  return data ? JSON.parse(data) : [];
};

export const archiveProtocol = (protocol: GLP1Protocol): void => {
  // Remove from active
  deleteGLP1Protocol(protocol.id);
  // Add to archived
  const archived = getArchivedProtocols();
  archived.push({ ...protocol, isArchived: true });
  localStorage.setItem(STORAGE_KEYS.GLP1_ARCHIVED, JSON.stringify(archived));
};

export const deleteArchivedProtocol = (id: string): void => {
  const archived = getArchivedProtocols().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.GLP1_ARCHIVED, JSON.stringify(archived));
};

export const clearGLP1Protocol = (): void => {
  localStorage.removeItem(STORAGE_KEYS.GLP1_PROTOCOL);
};

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
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
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