import { CsvRow, ImportPreview, ImportResult, ImportMode, SIDE_EFFECT_KEYS } from '../utils/csvTypes';
import { WeightEntry, GLP1Entry, UserProfile, GLP1Protocol, SideEffect, Peptide, PeptideLogEntry, MedicationStorage } from '../types';
import {
  parseCsv,
  generateImportPreview,
  convertToWeightEntry,
  convertToDoseEntry,
  convertToUserProfile,
  hasData,
} from '../utils/csvImport';
import {
  exportAllToCsv,
  generateExportFilename,
  downloadCsv,
} from '../utils/csvExport';
import {
  saveWeightEntries,
  getWeightEntries,
  setMedicationEntries,
  getMedicationEntries,
  saveMedicationManualEntries,
  saveMedicationProtocols,
  getMedicationProtocols,
  saveUserProfile,
  getUserProfile,
  clearAllData,
  getPeptides,
  savePeptides,
  getPeptideLogs,
  savePeptideLogs,
  getMedicationStorage,
  saveMedicationStorage,
} from '../shared/utils/database';

class DataImportExportService {
  private currentParsedRows: CsvRow[] = [];
  private currentRawContent: string = '';
  
  async exportData(): Promise<void> {
    console.log('Starting CSV export with embedded protocols...');
    const [weightEntries, doseEntries, protocols, profile, peptides, peptideLogs, medicationStorage] = await Promise.all([
      getWeightEntries(),
      getMedicationEntries(),
      getMedicationProtocols(),
      getUserProfile(),
      getPeptides(),
      getPeptideLogs(),
      getMedicationStorage(),
    ]);
    
    const csvContent = exportAllToCsv(weightEntries, doseEntries, protocols, profile, peptides, peptideLogs, medicationStorage);
    const filename = generateExportFilename();
    downloadCsv(csvContent, filename);
  }
  
  parseImportFile(content: string, importWeightUnit: 'auto' | 'kg' | 'lbs' = 'auto'): ImportPreview {
    this.currentRawContent = content;
    this.currentParsedRows = parseCsv(content, importWeightUnit);
    return generateImportPreview(this.currentParsedRows);
  }
  
  async importData(
    mode: ImportMode,
    options?: {
      includeData?: boolean;
      includeUserSettings?: boolean;
      importWeightUnit?: 'auto' | 'kg' | 'lbs';
      offsetDays?: number;
      offsetHours?: number;
    }
  ): Promise<ImportResult> {
    const includeData = options?.includeData ?? true;
    const includeUserSettings = options?.includeUserSettings ?? true;
    const importWeightUnit = options?.importWeightUnit ?? 'auto';
    const offsetDays = options?.offsetDays ?? 0;
    const offsetHours = options?.offsetHours ?? 0;
    const dateOffset = offsetDays * 24 * 60 * 60 * 1000 + offsetHours * 60 * 60 * 1000;
    
    if (this.currentRawContent) {
      this.currentParsedRows = parseCsv(this.currentRawContent, importWeightUnit);
    }
    
    if (mode === 'replace') {
      await clearAllData();
    }
    
    const validRows = this.currentParsedRows.filter(hasData);
    
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    const weightEntries: WeightEntry[] = [];
    const doseEntries: GLP1Entry[] = [];
    
    if (mode === 'replace') {
      if (includeData) {        
        validRows.forEach(row => {
          if (!row.date) return;
          
          const weightEntry = convertToWeightEntry(row, dateOffset);
          const doseEntry = convertToDoseEntry(row, dateOffset);
          
          if (weightEntry && weightEntry.weight > 0) {
            weightEntries.push(weightEntry);
          }
          
          if (doseEntry && doseEntry.medication) {
            doseEntries.push(doseEntry);
          }
        });
        
        if (weightEntries.length > 0) {
          await saveWeightEntries(weightEntries);
          imported += weightEntries.length;
        }
        
        if (doseEntries.length > 0) {
          await setMedicationEntries(doseEntries);
          imported += doseEntries.length;
        }
      }
      
      if (includeUserSettings) {
        const userSettingsRow = validRows.find(row => row.age || row.gender || row.height || row.unitSystem);
        if (userSettingsRow) {
          const profile = convertToUserProfile(userSettingsRow);
          if (profile && profile.age > 0) {
            await saveUserProfile(profile);
            imported++;
          }
        }
      }
      
      const protocolRows = validRows.filter(row => row.Pid || row.Pmedication);
      if (protocolRows.length > 0) {
        const protocols: GLP1Protocol[] = protocolRows.map(row => ({
          id: row.Pid || '',
          medication: row.Pmedication || '',
          dose: row.Pdose || 0,
          frequencyPerWeek: row.PfrequencyPerWeek || 0,
          startDate: row.PstartDate || '',
          stopDate: row.PstopDate || null,
          halfLifeHours: row.PhalfLifeHours || 168,
          phase: row.Pphase as any || 'titrate',
        }));
        
        if (protocols.length > 0) {
          await saveMedicationProtocols(protocols);
          imported += protocols.length;
        }
      }
      
      const manualRows = validRows.filter(row => row.Mdate || row.Mmedication);
      if (manualRows.length > 0) {
        const manualEntries: GLP1Entry[] = manualRows.map(row => {
          const sideEffects: SideEffect[] = [];
          SIDE_EFFECT_KEYS.forEach(se => {
            const severity = (row as any)[se];
            if (severity !== undefined && severity > 0) {
              const name = se.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              sideEffects.push({ name, severity });
            }
          });
          
          return {
            date: row.Mdate || '',
            medication: row.Mmedication || '',
            dose: row.Mdose || 0,
            halfLifeHours: row.MhalfLifeHours || 168,
            isManual: true,
            time: row.Mtime,
            injectionSite: row.MinjectionSite,
            isr: row.Misr,
            painLevel: row.MpainLevel,
            notes: row.Mnotes,
            sideEffects,
          };
        });
        
        if (manualEntries.length > 0) {
          await saveMedicationManualEntries(manualEntries);
          imported += manualEntries.length;
        }
      }
      
      const peptideRows = validRows.filter(row => row.PepId || row.PepName);
      if (peptideRows.length > 0) {
        const peptides: Peptide[] = peptideRows.map(row => ({
          id: row.PepId || crypto.randomUUID(),
          name: row.PepName || '',
          category: (row.PepCategory as any) || 'healing',
          dose: row.PepDose || 0,
          doseUnit: (row.PepDoseUnit as any) || 'mg',
          frequency: (row.PepFrequency as any) || 'daily',
          preferredTime: row.PepPreferredTime || '08:00',
          route: (row.PepRoute as any) || 'subcutaneous',
          startDate: row.PepStartDate || '',
          endDate: row.PepEndDate || null,
          halfLifeHours: row.PepHalfLifeHours || 24,
          notes: row.PepNotes || '',
          color: row.PepColor || '#4ADEA8',
          isActive: row.PepIsActive ?? true,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          cycles: [],
        }));
        
        if (peptides.length > 0) {
          await savePeptides(peptides);
          imported += peptides.length;
        }
      }
      
      const peptideLogRows = validRows.filter(row => row.PLdate || row.PLpeptideId);
      if (peptideLogRows.length > 0) {
        const peptideLogs: PeptideLogEntry[] = peptideLogRows.map(row => ({
          id: crypto.randomUUID(),
          peptideId: row.PLpeptideId || '',
          date: row.PLdate || '',
          time: row.PLtime || '',
          dose: row.PLdose || 0,
          doseUnit: (row.PLdoseUnit as any) || 'mg',
          route: (row.PLroute as any) || 'subcutaneous',
          injectionSite: row.PLinjectionSite || '',
          painLevel: row.PLpainLevel || null,
          notes: row.PLnotes || '',
          createdAt: new Date().toISOString(),
        }));
        
        if (peptideLogs.length > 0) {
          await savePeptideLogs(peptideLogs);
          imported += peptideLogs.length;
        }
      }
      
      // Medication Storage import (replace mode)
      const storageRows = validRows.filter(row => row.MSid || row.MSmedicationName);
      if (storageRows.length > 0) {
        const storageItems: MedicationStorage[] = storageRows.map(row => ({
          id: row.MSid || crypto.randomUUID(),
          medicationName: row.MSmedicationName || '',
          category: (row.MScategory as any) || 'glp1',
          type: (row.MStype as any) || 'vial',
          dosagePerUnit: row.MSdosagePerUnit || 0,
          initialUnits: row.MSinitialUnits || 0,
          remainingUnits: row.MSremainingUnits || 0,
          unitCost: row.MSunitCost || 0,
          purchaseDate: row.MSpurchaseDate || '',
          expiryDate: row.MSexpiryDate || undefined,
          notes: row.MSnotes || '',
          isActive: row.MSisActive ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        if (storageItems.length > 0) {
          await saveMedicationStorage(storageItems);
          imported += storageItems.length;
        }
      }
    } else {
      validRows.forEach(row => {
        if (!row.date) {
          skipped++;
          return;
        }
        
        const weightEntry = convertToWeightEntry(row, dateOffset);
        const doseEntry = convertToDoseEntry(row, dateOffset);
        
        if (weightEntry && weightEntry.weight > 0) {
          weightEntries.push(weightEntry);
        }
        
        if (doseEntry && doseEntry.medication) {
          doseEntries.push(doseEntry);
        }
      });
      
      if (weightEntries.length > 0) {
        await saveWeightEntries(weightEntries);
        imported += weightEntries.length;
      }
      
      if (doseEntries.length > 0) {
        await setMedicationEntries(doseEntries);
        imported += doseEntries.length;
      }
      
      const manualRows = validRows.filter(row => row.Mdate || row.Mmedication);
      if (manualRows.length > 0) {
        const manualEntries: GLP1Entry[] = manualRows.map(row => {
          const sideEffects: SideEffect[] = [];
          SIDE_EFFECT_KEYS.forEach(se => {
            const severity = (row as any)[se];
            if (severity !== undefined && severity > 0) {
              const name = se.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              sideEffects.push({ name, severity });
            }
          });
          
          return {
            date: row.Mdate || '',
            medication: row.Mmedication || '',
            dose: row.Mdose || 0,
            halfLifeHours: row.MhalfLifeHours || 168,
            isManual: true,
            time: row.Mtime,
            injectionSite: row.MinjectionSite,
            isr: row.Misr,
            painLevel: row.MpainLevel,
            notes: row.Mnotes,
            sideEffects,
          };
        });
        
        if (manualEntries.length > 0) {
          await saveMedicationManualEntries(manualEntries);
          imported += manualEntries.length;
        }
      }
      
      const protocolRows = validRows.filter(row => row.Pid || row.Pmedication);
      if (protocolRows.length > 0) {
        const protocols: GLP1Protocol[] = protocolRows.map(row => ({
          id: row.Pid || '',
          medication: row.Pmedication || '',
          dose: row.Pdose || 0,
          frequencyPerWeek: row.PfrequencyPerWeek || 0,
          startDate: row.PstartDate || '',
          stopDate: row.PstopDate || null,
          halfLifeHours: row.PhalfLifeHours || 168,
          phase: row.Pphase as any || 'titrate',
        }));
        
        if (protocols.length > 0) {
          const existingProtocols = await getMedicationProtocols();
          const mergedProtocols = [...existingProtocols, ...protocols];
          await saveMedicationProtocols(mergedProtocols);
          imported += protocols.length;
        }
      }
      
      if (includeUserSettings) {
        const userSettingsRow = validRows.find(row => row.age || row.gender || row.height || row.unitSystem || row.activityLevel || row.goalWeight);
        if (userSettingsRow) {
          const profile = convertToUserProfile(userSettingsRow);
          if (profile && profile.age > 0) {
            await saveUserProfile(profile);
            imported++;
          }
        }
      }
      
      const mergePeptideRows = validRows.filter(row => row.PepId || row.PepName);
      if (mergePeptideRows.length > 0) {
        const peptides: Peptide[] = mergePeptideRows.map(row => ({
          id: row.PepId || crypto.randomUUID(),
          name: row.PepName || '',
          category: (row.PepCategory as any) || 'healing',
          dose: row.PepDose || 0,
          doseUnit: (row.PepDoseUnit as any) || 'mg',
          frequency: (row.PepFrequency as any) || 'daily',
          preferredTime: row.PepPreferredTime || '08:00',
          route: (row.PepRoute as any) || 'subcutaneous',
          startDate: row.PepStartDate || '',
          endDate: row.PepEndDate || null,
          halfLifeHours: row.PepHalfLifeHours || 24,
          notes: row.PepNotes || '',
          color: row.PepColor || '#4ADEA8',
          isActive: row.PepIsActive ?? true,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          cycles: [],
        }));
        
        if (peptides.length > 0) {
          const existingPeptides = await getPeptides();
          const mergedPeptides = [...existingPeptides, ...peptides];
          await savePeptides(mergedPeptides);
          imported += peptides.length;
        }
      }
      
      const mergePeptideLogRows = validRows.filter(row => row.PLdate || row.PLpeptideId);
      if (mergePeptideLogRows.length > 0) {
        const peptideLogs: PeptideLogEntry[] = mergePeptideLogRows.map(row => ({
          id: crypto.randomUUID(),
          peptideId: row.PLpeptideId || '',
          date: row.PLdate || '',
          time: row.PLtime || '',
          dose: row.PLdose || 0,
          doseUnit: (row.PLdoseUnit as any) || 'mg',
          route: (row.PLroute as any) || 'subcutaneous',
          injectionSite: row.PLinjectionSite || '',
          painLevel: row.PLpainLevel || null,
          notes: row.PLnotes || '',
          createdAt: new Date().toISOString(),
        }));
        
        if (peptideLogs.length > 0) {
          const existingLogs = await getPeptideLogs();
          const mergedLogs = [...existingLogs, ...peptideLogs];
          await savePeptideLogs(mergedLogs);
          imported += peptideLogs.length;
        }
      }
      
      // Medication Storage import (merge mode)
      const mergeStorageRows = validRows.filter(row => row.MSid || row.MSmedicationName);
      if (mergeStorageRows.length > 0) {
        const storageItems: MedicationStorage[] = mergeStorageRows.map(row => ({
          id: row.MSid || crypto.randomUUID(),
          medicationName: row.MSmedicationName || '',
          category: (row.MScategory as any) || 'glp1',
          type: (row.MStype as any) || 'vial',
          dosagePerUnit: row.MSdosagePerUnit || 0,
          initialUnits: row.MSinitialUnits || 0,
          remainingUnits: row.MSremainingUnits || 0,
          unitCost: row.MSunitCost || 0,
          purchaseDate: row.MSpurchaseDate || '',
          expiryDate: row.MSexpiryDate || undefined,
          notes: row.MSnotes || '',
          isActive: row.MSisActive ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        if (storageItems.length > 0) {
          const existingStorage = await getMedicationStorage();
          const mergedStorage = [...existingStorage, ...storageItems];
          await saveMedicationStorage(mergedStorage);
          imported += storageItems.length;
        }
      }
    }
    
    return {
      success: true,
      imported,
      skipped,
      errors,
    };
  }

  getCurrentData() {
    return {
      weightCount: 0,
      doseCount: 0,
      protocolCount: 0,
    };
  }
}

export const dataImportExportService = new DataImportExportService();
