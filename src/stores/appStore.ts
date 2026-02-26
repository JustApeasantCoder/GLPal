import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WeightEntry, GLP1Entry, GLP1Protocol, UserProfile, Peptide, PeptideLogEntry, MedicationStorage } from '../types';
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
  getMedicationStorage,
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
  addMedicationStorage as dbAddMedicationStorage,
  updateMedicationStorage as dbUpdateMedicationStorage,
  deleteMedicationStorage as dbDeleteMedicationStorage,
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
  medicationStorage: MedicationStorage[];
  collapsedMedications: string[];
  latestDoseDone: number | null;
  isInitialized: boolean;
}

interface AppActions {
  initialize: () => Promise<void>;
  setActiveTab: (tab: TabType) => void;
  setActiveModal: (modal: ModalType | null) => void;
  setChartPeriod: (period: ChartPeriod) => void;
  
  addWeight: (entry: WeightEntry) => Promise<void>;
  deleteWeight: (date: string) => Promise<void>;
  refreshWeights: () => Promise<void>;
  
  addDose: (entry: GLP1Entry) => Promise<void>;
  deleteDose: (date: string) => Promise<void>;
  refreshDoses: () => Promise<void>;
  
  setProtocols: (protocols: GLP1Protocol[]) => Promise<void>;
  generateDosesFromProtocols: () => Promise<void>;
  
  updateProfile: (profile: UserProfile) => Promise<void>;
  
  addPeptide: (peptide: Peptide) => Promise<void>;
  updatePeptide: (peptide: Peptide) => Promise<void>;
  deletePeptide: (id: string) => Promise<void>;
  
  addPeptideLog: (log: PeptideLogEntry) => Promise<void>;
  deletePeptideLog: (id: string) => Promise<void>;
  
  addMedicationStorage: (item: MedicationStorage) => Promise<void>;
  updateMedicationStorage: (item: MedicationStorage) => Promise<void>;
  deleteMedicationStorage: (id: string) => Promise<void>;
  
  setCollapsedMedications: (medications: string[]) => void;
  setLatestDoseDone: (timestamp: number | null) => void;
  
  clearAllData: () => Promise<void>;
  generateSampleData: () => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  age: 35,
  gender: 'male',
  height: 180,
  activityLevel: 1.2,
  unitSystem: 'metric',
  useWheelForNumbers: false,
  useWheelForDate: false,
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
      medicationStorage: [],
      collapsedMedications: [],
      latestDoseDone: null,
      isInitialized: false,

      initialize: async () => {
        await initializeDatabase();
        
        const [weights, dosesEntries, protocols, profile, peptides, peptideLogs, medicationStorage] = await Promise.all([
          getWeightEntries(),
          getAllMedicationEntries(),
          getMedicationProtocols(),
          getUserProfile(),
          getPeptides(),
          getPeptideLogs(),
          getMedicationStorage(),
        ]);
        
        const collapsedMedStr = localStorage.getItem('glpal_collapsed_medications');
        const collapsedMedications = collapsedMedStr ? JSON.parse(collapsedMedStr) : [];
        
        const latestDoseDoneStr = localStorage.getItem('latestDoseDone');
        const latestDoseDone = latestDoseDoneStr ? parseInt(latestDoseDoneStr, 10) : null;
        
        const savedTab = localStorage.getItem('glpal_active_tab') as TabType | null;
        const savedPeriod = localStorage.getItem('glpal_chart_period') as ChartPeriod | null;
        
        set({
          weights: weights || [],
          dosesEntries: dosesEntries || [],
          protocols: protocols || [],
          profile: profile || DEFAULT_PROFILE,
          peptides: peptides || [],
          peptideLogs: peptideLogs || [],
          medicationStorage: medicationStorage || [],
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

      addWeight: async (entry) => {
        await dbAddWeightEntry(entry);
        const weights = await getWeightEntries();
        set({ weights });
      },

      deleteWeight: async (date) => {
        await dbDeleteWeightEntry(date);
        const weights = await getWeightEntries();
        set({ weights });
      },

      refreshWeights: async () => {
        const weights = await getWeightEntries();
        set({ weights });
      },

      addDose: async (entry) => {
        await dbAddMedicationManualEntry(entry);
        const dosesEntries = await getAllMedicationEntries();
        set({ dosesEntries });
      },

      deleteDose: async (date) => {
        await dbDeleteMedicationManualEntry(date);
        const dosesEntries = await getAllMedicationEntries();
        set({ dosesEntries });
      },

      refreshDoses: async () => {
        const dosesEntries = await getAllMedicationEntries();
        set({ dosesEntries });
      },

      setProtocols: async (protocols) => {
        await saveMedicationProtocols(protocols);
        set({ protocols });
      },

      generateDosesFromProtocols: async () => {
        const { protocols } = get();
        const existingManual = await getAllMedicationEntries().then(entries => entries.filter(e => e.isManual));
        await clearMedicationEntries();
        const generatedDoses = generateDosesFromProtocols(protocols, []);
        for (const entry of generatedDoses) {
          await dbAddMedicationGeneratedEntry(entry);
        }
        
        for (const entry of existingManual) {
          await dbAddMedicationManualEntry(entry);
        }
        
        const dosesEntries = await getAllMedicationEntries();
        set({ dosesEntries });
      },

      updateProfile: async (profile) => {
        await saveUserProfile(profile);
        set({ profile });
      },

      addPeptide: async (peptide) => {
        await dbAddPeptide(peptide);
        const peptides = await getPeptides();
        set({ peptides });
      },

      updatePeptide: async (peptide) => {
        await dbUpdatePeptide(peptide);
        const peptides = await getPeptides();
        set({ peptides });
      },

      deletePeptide: async (id) => {
        await dbDeletePeptide(id);
        const peptides = await getPeptides();
        const peptideLogs = await getPeptideLogs();
        set({ peptides, peptideLogs });
      },

      addPeptideLog: async (log) => {
        await dbAddPeptideLog(log);
        const peptideLogs = await getPeptideLogs();
        set({ peptideLogs });
      },

      deletePeptideLog: async (id) => {
        await dbDeletePeptideLog(id);
        const peptideLogs = await getPeptideLogs();
        set({ peptideLogs });
      },

      addMedicationStorage: async (item) => {
        await dbAddMedicationStorage(item);
        const medicationStorage = await getMedicationStorage();
        set({ medicationStorage });
      },

      updateMedicationStorage: async (item) => {
        await dbUpdateMedicationStorage(item);
        const medicationStorage = await getMedicationStorage();
        set({ medicationStorage });
      },

      deleteMedicationStorage: async (id) => {
        await dbDeleteMedicationStorage(id);
        const medicationStorage = await getMedicationStorage();
        set({ medicationStorage });
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

      clearAllData: async () => {
        await clearAllData();
        set({
          weights: [],
          dosesEntries: [],
          protocols: [],
          profile: DEFAULT_PROFILE,
          peptides: [],
          peptideLogs: [],
          medicationStorage: [],
          collapsedMedications: [],
          latestDoseDone: null,
        });
      },

      generateSampleData: async () => {
        await clearAllData();
        initializeSampleData();
        
        const [weights, dosesEntries, protocols, profile, medicationStorage] = await Promise.all([
          getWeightEntries(),
          getAllMedicationEntries(),
          getMedicationProtocols(),
          getUserProfile(),
          getMedicationStorage(),
        ]);
        
        set({
          weights: weights || [],
          dosesEntries: dosesEntries || [],
          protocols: protocols || [],
          profile: profile || DEFAULT_PROFILE,
          medicationStorage: medicationStorage || [],
        });
      },
    }),
    {
      name: 'glpal-storage',
      partialize: (state) => ({
        activeTab: state.activeTab,
        chartPeriod: state.chartPeriod,
        collapsedMedications: state.collapsedMedications,
        latestDoseDone: state.latestDoseDone,
      }),
    }
  )
);
