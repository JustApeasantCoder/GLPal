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
  saveMedicationProtocols,
  getMedicationProtocols,
  saveUserProfile,
  clearAllData,
} from '../shared/utils/database';

class DataImportExportService {
  private currentParsedRows: CsvRow[] = [];
  
   exportData(includeProtocols: boolean = false): void {
    console.log('Starting export, includeProtocols:', includeProtocols);
    const csvContent = exportAllToCsv();
    const filename = generateExportFilename();
    downloadCsv(csvContent, filename);
    
    if (includeProtocols) {
      console.log('Calling exportProtocols...');
      // Use setTimeout to ensure this happens after CSV download
      setTimeout(() => {
        console.log('Executing protocol export...');
        this.exportProtocols();
      }, 100);
    } else {
      console.log('Skipping protocol export');
    }
  }
  
  exportProtocols(): void {
    try {
      console.log('Starting protocol export...');
      const protocols = getMedicationProtocols();
      console.log(`Found ${protocols.length} protocols to export`);
      
      const jsonContent = JSON.stringify(protocols, null, 2);
      const filename = `glpal_protocols_${new Date().toISOString().split('T')[0]}.json`;
      
      console.log('Creating download...');
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Ensure link is properly set up
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Trigger click
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Protocol export completed successfully');
      }, 100);
      
    } catch (error) {
      console.error('Protocol export failed:', error);
    }
  }
  
  parseImportFile(content: string): ImportPreview {
    this.currentParsedRows = parseCsv(content);
    return generateImportPreview(this.currentParsedRows);
  }
  
  parseProtocolFile(content: string): GLP1Protocol[] {
    try {
      const protocols = JSON.parse(content);
      return Array.isArray(protocols) ? protocols : [];
    } catch (error) {
      console.error('Failed to parse protocol file:', error);
      return [];
    }
  }
  
  importData(
    mode: ImportMode,
    options?: {
      includeData?: boolean;
      includeUserSettings?: boolean;
      includeProtocols?: boolean;
      protocolData?: string;
    }
  ): ImportResult {
    const includeData = options?.includeData ?? true;
    const includeUserSettings = options?.includeUserSettings ?? true;
    const includeProtocols = options?.includeProtocols ?? false;
    
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
      
      // Import protocols if provided
      if (includeProtocols && options?.protocolData) {
        const protocols = this.parseProtocolFile(options.protocolData);
        if (protocols.length > 0) {
          saveMedicationProtocols(protocols);
          imported += protocols.length;
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
  }
}

export const dataImportExportService = new DataImportExportService();
