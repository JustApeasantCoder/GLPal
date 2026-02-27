import { StorageCategory, StorageType, PeptideCategory } from '../../../types';
import { PEPTIDE_PRESETS } from '../../../types';

export const CATEGORIES: { id: StorageCategory; label: string }[] = [
  { id: 'glp1', label: 'GLP-1' },
  { id: 'peptide', label: 'Peptide' },
  { id: 'other', label: 'Other' },
];

export const STORAGE_TYPES: { id: StorageType; label: string }[] = [
  { id: 'vial', label: 'Vial' },
  { id: 'pen', label: 'Pen' },
  { id: 'powder', label: 'Powder' },
];

export const GLP1_COLORS = [
  '#9C7BD3', // Semaglutide
  '#4ADEA8', // Tirzepatide
  '#F59E0B', // Retatrutide
  '#EF4444', // Cagrilintide
  '#3B82F6', // Liraglutide
  '#94A3B8', // Dulaglutide
  '#6B7280', // Custom/Other
];

export const PEPTIDE_CATEGORY_COLORS: Record<PeptideCategory, string> = {
  healing: '#EF4444',
  growth_hormone: '#F59E0B',
  fat_loss: '#10B981',
  muscle: '#3B82F6',
  longevity: '#8B5CF6',
  immune: '#EC4899',
  skin: '#F472B6',
  cognitive: '#06B6D4',
  other: '#6B7280',
};

export const PEPTIDE_CATEGORY_LABELS: Record<PeptideCategory, string> = {
  healing: 'Healing',
  growth_hormone: 'GH',
  fat_loss: 'Fat Loss',
  muscle: 'Muscle',
  longevity: 'Longevity',
  immune: 'Immune',
  skin: 'Skin',
  cognitive: 'Cognitive',
  other: 'Other',
};

export const PEPTIDE_CATEGORIES: PeptideCategory[] = [
  'healing', 'growth_hormone', 'fat_loss', 'muscle', 'skin', 'longevity', 'immune', 'cognitive', 'other'
];

export const getStorageItemColor = (item: { category: StorageCategory; medicationName: string }, glp1MedicationOrder: string[] = []): string => {
  if (item.category === 'glp1') {
    let medIndex = glp1MedicationOrder.indexOf(item.medicationName);
    if (medIndex === -1) {
      const baseName = item.medicationName.toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
      for (let i = 0; i < glp1MedicationOrder.length; i++) {
        const logMedBase = glp1MedicationOrder[i].toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
        if (baseName.includes(logMedBase) || logMedBase.includes(baseName)) {
          medIndex = i;
          break;
        }
      }
    }
    return GLP1_COLORS[medIndex >= 0 ? medIndex : GLP1_COLORS.length - 1];
  }
  
  if (item.category === 'peptide') {
    const peptide = PEPTIDE_PRESETS.find(p => 
      item.medicationName.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(item.medicationName.toLowerCase())
    );
    return peptide ? PEPTIDE_CATEGORY_COLORS[peptide.category] : '#6B7280';
  }
  
  return '#6B7280';
};

export const getStorageTypeColor = (type: StorageType): string => {
  return type === 'vial' ? 'bg-purple-500/20 text-purple-400' :
         type === 'pen' ? 'bg-orange-500/20 text-orange-400' :
         'bg-gray-500/20 text-gray-400';
};
