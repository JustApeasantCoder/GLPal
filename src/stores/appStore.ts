import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WeightEntry, GLP1Entry, GLP1Protocol, UserProfile, Peptide, PeptideLogEntry } from '../types';
import { ChartPeriod } from '../shared/hooks';
import { ModalType } from '../shared/hooks/useAppHistory';
import {
  initializeDatabase,
  getWeightEntries,
  getAllMedicationEntries,
  getMedicationProtocols,
  getUserProfile,
  getPeptides,
  getPeptideLogs,
  saveUserProfile,
  clearAllData,
  addWeightEntry as dbAddWeightEntry,
  deleteWeightEntry as dbDeleteWeightEntry,
  addMedicationManualEntry as dbAddMedicationManualEntry,
  deleteMedicationManualEntry as dbDeleteMedicationManualEntry,
  addMedicationGeneratedEntry as dbAddMedicationGeneratedEntry,
  clearMedicationEntries,
  saveMedicationProtocols,
  savePeptides,
  savePeptideLogs,
  addPeptideLog as dbAddPeptideLog,
  deletePeptideLog as dbDeletePeptideLog,
  addPeptide as dbAddPeptide,
  updatePeptide as dbUpdatePeptide,
  deletePeptide as dbDeletePeptide,
} from '../shared/utils/database';
import { initializeSampleData } from '../shared/utils/sampleData';
import { generateDosesFromProtocols } from '../services/MedicationService';

export type TabType = 'dashboard' | 'doses' | 'dosage' | 'log' | 'peptides';

interface AppState {
  activeTab: TabType;
  activeModal: ModalType | null;
  chartPeriod: ChartPeriod;
  weights: WeightEntry[];
  dosesEntries: GLP1Entry[];
  protocols: GLP1Protocol[];
  profile: UserProfile;
  peptides: Peptide[];
  peptideLogs: PeptideLogEntry[];
  collapsedMedications: string[];
  latestDoseDone: number | null;
  isInitialized: boolean;
}

interface AppActions {
  initialize: () => void;
  setActiveTab: (tab: TabType) => void;
  setActiveModal: (modal: ModalType | null) => void;
  setChartPeriod: (period: ChartPeriod) => void;
  
  addWeight: (entry: WeightEntry) => void;
  deleteWeight: (date: string) => void;
  refreshWeights: () => void;
  
  addDose: (entry: GLP1Entry) => void;
  deleteDose: (date: string) => void;
  refreshDoses: () => void;
  
  setProtocols: (protocols: GLP1Protocol[]) => void;
  generateDosesFromProtocols: () => void;
  
  updateProfile: (profile: UserProfile) => void;
  
  addPeptide: (peptide: Peptide) => void;
  updatePeptide: (peptide: Peptide) => void;
  deletePeptide: (id: string) => void;
  
  addPeptideLog: (log: PeptideLogEntry) => void;
  deletePeptideLog: (id: string) => void;
  
  setCollapsedMedications: (medications: string[]) => void;
  setLatestDoseDone: (timestamp: number | null) => void;
  
  clearAllData: () => void;
  generateSampleData: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  age: 35,
  gender: 'male',
  height: 180,
  activityLevel: 1.2,
  unitSystem: 'metric',
  useWheelForNumbers: false,
  useWheelForDate: true,
};

const DEFAULT_CHART_PERIOD: ChartPeriod = '90days';

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      activeTab: 'dashboard',
      activeModal: null,
      chartPeriod: DEFAULT_CHART_PERIOD,
      weights: [],
      dosesEntries: [],
      protocols: [],
      profile: DEFAULT_PROFILE,
      peptides: [],
      peptideLogs: [],
      collapsedMedications: [],
      latestDoseDone: null,
      isInitialized: false,

      initialize: () => {
        initializeDatabase();
        
        const weights = getWeightEntries();
        const dosesEntries = getAllMedicationEntries();
        const protocols = getMedicationProtocols();
        const profile = getUserProfile() || DEFAULT_PROFILE;
        const peptides = getPeptides();
        const peptideLogs = getPeptideLogs();
        
        const collapsedMedStr = localStorage.getItem('glpal_collapsed_medications');
        const collapsedMedications = collapsedMedStr ? JSON.parse(collapsedMedStr) : [];
        
        const latestDoseDoneStr = localStorage.getItem('latestDoseDone');
        const latestDoseDone = latestDoseDoneStr ? parseInt(latestDoseDoneStr, 10) : null;
        
        const savedTab = localStorage.getItem('glpal_active_tab') as TabType | null;
        const savedPeriod = localStorage.getItem('glpal_chart_period') as ChartPeriod | null;
        
        set({
          weights,
          dosesEntries,
          protocols,
          profile,
          peptides,
          peptideLogs,
          collapsedMedications,
          latestDoseDone,
          activeTab: savedTab || 'dashboard',
          chartPeriod: savedPeriod || DEFAULT_CHART_PERIOD,
          isInitialized: true,
        });
      },

      setActiveTab: (tab) => {
        localStorage.setItem('glpal_active_tab', tab);
        set({ activeTab: tab });
      },

      setActiveModal: (modal) => set({ activeModal: modal }),

      setChartPeriod: (period) => {
        localStorage.setItem('glpal_chart_period', period);
        set({ chartPeriod: period });
      },

      addWeight: (entry) => {
        dbAddWeightEntry(entry);
        const weights = getWeightEntries();
        set({ weights });
      },

      deleteWeight: (date) => {
        dbDeleteWeightEntry(date);
        const weights = getWeightEntries();
        set({ weights });
      },

      refreshWeights: () => {
        const weights = getWeightEntries();
        set({ weights });
      },

      addDose: (entry) => {
        dbAddMedicationManualEntry(entry);
        const dosesEntries = getAllMedicationEntries();
        set({ dosesEntries });
      },

      deleteDose: (date) => {
        dbDeleteMedicationManualEntry(date);
        const dosesEntries = getAllMedicationEntries();
        set({ dosesEntries });
      },

      refreshDoses: () => {
        const dosesEntries = getAllMedicationEntries();
        set({ dosesEntries });
      },

      setProtocols: (protocols) => {
        saveMedicationProtocols(protocols);
        set({ protocols });
      },

      generateDosesFromProtocols: () => {
        const { protocols } = get();
        clearMedicationEntries();
        const generatedDoses = generateDosesFromProtocols(protocols, []);
        generatedDoses.forEach(entry => dbAddMedicationGeneratedEntry(entry));
        
        const dosesEntries = getAllMedicationEntries();
        set({ dosesEntries });
      },

      updateProfile: (profile) => {
        saveUserProfile(profile);
        set({ profile });
      },

      addPeptide: (peptide) => {
        dbAddPeptide(peptide);
        const peptides = getPeptides();
        set({ peptides });
      },

      updatePeptide: (peptide) => {
        dbUpdatePeptide(peptide);
        const peptides = getPeptides();
        set({ peptides });
      },

      deletePeptide: (id) => {
        dbDeletePeptide(id);
        const peptides = getPeptides();
        const peptideLogs = getPeptideLogs();
        set({ peptides, peptideLogs });
      },

      addPeptideLog: (log) => {
        dbAddPeptideLog(log);
        const peptideLogs = getPeptideLogs();
        set({ peptideLogs });
      },

      deletePeptideLog: (id) => {
        dbDeletePeptideLog(id);
        const peptideLogs = getPeptideLogs();
        set({ peptideLogs });
      },

      setCollapsedMedications: (medications) => {
        localStorage.setItem('glpal_collapsed_medications', JSON.stringify(medications));
        set({ collapsedMedications: medications });
      },

      setLatestDoseDone: (timestamp) => {
        if (timestamp) {
          localStorage.setItem('latestDoseDone', timestamp.toString());
        } else {
          localStorage.removeItem('latestDoseDone');
        }
        set({ latestDoseDone: timestamp });
      },

      clearAllData: () => {
        clearAllData();
        set({
          weights: [],
          dosesEntries: [],
          protocols: [],
          profile: DEFAULT_PROFILE,
          peptides: [],
          peptideLogs: [],
          collapsedMedications: [],
          latestDoseDone: null,
        });
      },

      generateSampleData: () => {
        clearAllData();
        initializeSampleData();
        
        const weights = getWeightEntries();
        const dosesEntries = getAllMedicationEntries();
        const protocols = getMedicationProtocols();
        const profile = getUserProfile() || DEFAULT_PROFILE;
        
        set({
          weights,
          dosesEntries,
          protocols,
          profile,
        });
      },
    }),
    {
      name: 'glpal-storage',
      partialize: (state) => ({
        activeTab: state.activeTab,
        chartPeriod: state.chartPeriod,
        profile: state.profile,
        collapsedMedications: state.collapsedMedications,
        latestDoseDone: state.latestDoseDone,
      }),
    }
  )
);
