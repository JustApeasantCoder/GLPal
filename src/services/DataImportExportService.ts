import { CsvRow, ImportPreview, ImportResult, ImportMode } from '../utils/csvTypes';
import { WeightEntry, GLP1Entry, UserProfile, GLP1Protocol } from '../types';
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
  getMedicationManualEntries,
  saveMedicationManualEntries,
  saveMedicationProtocols,
  getMedicationProtocols,
  saveUserProfile,
  clearAllData,
} from '../shared/utils/database';

class DataImportExportService {
  private currentParsedRows: CsvRow[] = [];
  private currentRawContent: string = '';
  
   exportData(): void {
    console.log('Starting CSV export with embedded protocols...');
    const csvContent = exportAllToCsv();
    const filename = generateExportFilename();
    downloadCsv(csvContent, filename);
  }
  
  parseImportFile(content: string, importWeightUnit: 'auto' | 'kg' | 'lbs' = 'auto'): ImportPreview {
    this.currentRawContent = content;
    this.currentParsedRows = parseCsv(content, importWeightUnit);
    return generateImportPreview(this.currentParsedRows);
  }
  
  importData(
    mode: ImportMode,
    options?: {
      includeData?: boolean;
      includeUserSettings?: boolean;
      importWeightUnit?: 'auto' | 'kg' | 'lbs';
    }
  ): ImportResult {
    const includeData = options?.includeData ?? true;
    const includeUserSettings = options?.includeUserSettings ?? true;
    const importWeightUnit = options?.importWeightUnit ?? 'auto';
    
    if (this.currentRawContent) {
      this.currentParsedRows = parseCsv(this.currentRawContent, importWeightUnit);
    }
    
    if (mode === 'replace') {
      clearAllData();
    }
    
    const validRows = this.currentParsedRows.filter(hasData);
    
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    if (mode === 'replace') {
      if (includeData) {
        const weightEntries: WeightEntry[] = [];
        const doseEntries: GLP1Entry[] = [];
        
        validRows.forEach(row => {
          if (!row.date) return;
          
          const weightEntry = convertToWeightEntry(row);
          const doseEntry = convertToDoseEntry(row);
          
          if (weightEntry && weightEntry.weight > 0) {
            weightEntries.push(weightEntry);
          }
          
          if (doseEntry && doseEntry.medication) {
            doseEntries.push(doseEntry);
          }
        });
        
        if (weightEntries.length > 0) {
          saveWeightEntries(weightEntries);
          imported += weightEntries.length;
        }
        
        if (doseEntries.length > 0) {
          setMedicationEntries(doseEntries);
          imported += doseEntries.length;
        }
      }
      
      if (includeUserSettings) {
        const userSettingsRow = validRows.find(row => row.age || row.gender || row.height || row.unitSystem);
        if (userSettingsRow) {
          const profile = convertToUserProfile(userSettingsRow);
          if (profile && profile.age > 0) {
            saveUserProfile(profile);
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
          saveMedicationProtocols(protocols);
          imported += protocols.length;
        }
      }
      
      const manualRows = validRows.filter(row => row.Mdate || row.Mmedication);
      if (manualRows.length > 0) {
        const manualEntries: GLP1Entry[] = manualRows.map(row => ({
          date: row.Mdate || '',
          medication: row.Mmedication || '',
          dose: row.Mdose || 0,
          halfLifeHours: row.MhalfLifeHours || 168,
          time: row.Mtime,
          injectionSite: row.MinjectionSite,
          isr: row.Misr,
          notes: row.Mnotes,
          painLevel: row.MpainLevel,
          isManual: true,
        }));
        
        if (manualEntries.length > 0) {
          saveMedicationManualEntries(manualEntries);
          imported += manualEntries.length;
        }
      }
    } else {
      if (includeData) {
        const existingWeight = getWeightEntries();
        const existingDosesGenerated = getMedicationEntries();
        const existingDosesManual = getMedicationManualEntries();
        
        const newWeight: WeightEntry[] = [];
        const newDoses: GLP1Entry[] = [];
        
        validRows.forEach(row => {
          if (!row.date) return;
          
          const weightEntry = convertToWeightEntry(row);
          const doseEntry = convertToDoseEntry(row);
          
          if (weightEntry && weightEntry.weight > 0) {
            const exists = existingWeight.some(e => e.date === weightEntry.date);
            if (exists) {
              skipped++;
            } else {
              newWeight.push(weightEntry);
            }
          }
          
          if (doseEntry && doseEntry.medication) {
            const exists = [...existingDosesGenerated, ...existingDosesManual].some(
              e => e.date === doseEntry.date && e.medication === doseEntry.medication
            );
            if (exists) {
              skipped++;
            } else {
              newDoses.push({ ...doseEntry, isManual: true });
            }
          }
        });
        
        if (newWeight.length > 0) {
          const merged = [...existingWeight, ...newWeight].sort((a, b) => a.date.localeCompare(b.date));
          saveWeightEntries(merged);
          imported += newWeight.length;
        }
        
         if (newDoses.length > 0) {
          const merged = [...existingDosesGenerated, ...newDoses].sort((a, b) => a.date.localeCompare(b.date));
          setMedicationEntries(merged);
          imported += newDoses.length;
        }
      }
      
      if (includeUserSettings) {
        const userSettingsRow = validRows.find(row => row.age || row.gender || row.height || row.unitSystem);
        if (userSettingsRow) {
          const profile = convertToUserProfile(userSettingsRow);
          if (profile && profile.age > 0) {
            saveUserProfile(profile);
            imported++;
          }
        }
      }
      
      // Import protocols from CSV (P-prefixed columns)
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
          saveMedicationProtocols(protocols);
          imported += protocols.length;
          console.log(`Imported ${protocols.length} protocols from CSV`);
        }
      }
      
      // Import manual medication entries from CSV (M-prefixed columns)
      const manualRows = validRows.filter(row => row.Mdate || row.Mmedication);
      if (manualRows.length > 0) {
        const existingManual = getMedicationManualEntries();
        const manualEntries: GLP1Entry[] = [];
        
        manualRows.forEach(row => {
          const entry: GLP1Entry = {
            date: row.Mdate || '',
            medication: row.Mmedication || '',
            dose: row.Mdose || 0,
            halfLifeHours: row.MhalfLifeHours || 168,
            time: row.Mtime,
            injectionSite: row.MinjectionSite,
            isr: row.Misr,
            notes: row.Mnotes,
            painLevel: row.MpainLevel,
            isManual: true,
          };
          
          const exists = existingManual.some(
            e => e.date === entry.date && e.medication === entry.medication
          );
          if (!exists) {
            manualEntries.push(entry);
          }
        });
        
        if (manualEntries.length > 0) {
          const merged = [...existingManual, ...manualEntries].sort((a, b) => a.date.localeCompare(b.date));
          saveMedicationManualEntries(merged);
          imported += manualEntries.length;
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
  
  clearParsedData(): void {
    this.currentParsedRows = [];
    this.currentRawContent = '';
  }
}

export const dataImportExportService = new DataImportExportService();
