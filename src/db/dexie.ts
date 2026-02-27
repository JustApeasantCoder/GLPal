import Dexie, { Table } from 'dexie';
import { WeightEntry, GLP1Entry, GLP1Protocol, UserProfile, Peptide, PeptideLogEntry, MedicationStorage, DailyLogEntry } from '../types';

export class GLPalDB extends Dexie {
  weights!: Table<WeightEntry, string>;
  medications!: Table<GLP1Entry, string>;
  protocols!: Table<GLP1Protocol, string>;
  peptides!: Table<Peptide, string>;
  peptideLogs!: Table<PeptideLogEntry, string>;
  userProfile!: Table<UserProfile, number>;
  medicationStorage!: Table<MedicationStorage, string>;
  dailyLogs!: Table<DailyLogEntry, string>;

  constructor() {
    super('GLPalDB');
    this.version(1).stores({
      weights: 'date',
      medications: '[date+medication], date, medication',
      protocols: 'id, medication, startDate',
      peptides: 'id, category, isActive',
      peptideLogs: 'id, peptideId, date',
      userProfile: '++id',
      medicationStorage: 'id, medicationName, category, isActive',
      dailyLogs: 'date'
    });
  }
}

export const db = new GLPalDB();

export const clearDatabase = async (): Promise<void> => {
  await db.weights.clear();
  await db.medications.clear();
  await db.protocols.clear();
  await db.peptides.clear();
  await db.peptideLogs.clear();
  await db.userProfile.clear();
  await db.medicationStorage.clear();
  await db.dailyLogs.clear();
};
