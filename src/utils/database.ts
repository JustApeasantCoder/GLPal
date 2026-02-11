import { WeightEntry, GLP1Entry, UserProfile } from '../types';

// localStorage-based database simulation for browser environment
const STORAGE_KEYS = {
  WEIGHT_ENTRIES: 'glpal_weight_entries',
  GLP1_ENTRIES: 'glp1_entries',
  USER_PROFILE: 'glpal_user_profile'
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