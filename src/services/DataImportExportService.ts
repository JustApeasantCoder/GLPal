import { CsvRow, ImportPreview, ImportResult, ImportMode, SIDE_EFFECT_KEYS } from '../utils/csvTypes';
import { WeightEntry, GLP1Entry, UserProfile, GLP1Protocol, SideEffect } from '../types';
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
  clearAllData,
} from '../shared/utils/database';

class DataImportExportService {
  private currentParsedRows: CsvRow[] = [];
  private currentRawContent: string = '';
  
  async exportData(): Promise<void> {
    console.log('Starting CSV export with embedded protocols...');
    const [weightEntries, doseEntries, protocols, profile] = await Promise.all([
      getWeightEntries(),
      getMedicationEntries(),
      getMedicationProtocols(),
      saveUserProfile({} as UserProfile).then(() => null).catch(() => null),
    ]);
    
    const csvContent = exportAllToCsv(weightEntries, doseEntries, protocols);
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
            sideEffects,
            notes: row.Mnotes,
          };
        });
        
        if (manualEntries.length > 0) {
          await saveMedicationManualEntries(manualEntries);
          imported += manualEntries.length;
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
      
      imported = weightEntries.length + doseEntries.length;
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
