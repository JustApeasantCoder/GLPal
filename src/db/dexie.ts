import Dexie, { Table } from 'dexie';
import { WeightEntry, GLP1Entry, GLP1Protocol, UserProfile, Peptide, PeptideLogEntry } from '../types';

export class GLPalDB extends Dexie {
  weights!: Table<WeightEntry, string>;
  medications!: Table<GLP1Entry, string>;
  protocols!: Table<GLP1Protocol, string>;
  peptides!: Table<Peptide, string>;
  peptideLogs!: Table<PeptideLogEntry, string>;
  userProfile!: Table<UserProfile, number>;

  constructor() {
    super('GLPalDB');
    this.version(1).stores({
      weights: 'date',
      medications: 'date, medication',
      protocols: 'id, medication, startDate',
      peptides: 'id, category, isActive',
      peptideLogs: 'id, peptideId, date',
      userProfile: '++id'
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
};
