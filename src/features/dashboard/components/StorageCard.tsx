import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MedicationStorage, StorageCategory, StorageType, PeptideCategory, GLP1Entry } from '../../../types';
import { useThemeStyles, useTheme } from '../../../contexts/ThemeContext';
import { timeService } from '../../../core/timeService';
import DateWheelPickerModal from '../../../shared/components/DateWheelPickerModal';
import CalendarPickerModal from '../../../shared/components/CalendarPickerModal';
import { MEDICATIONS } from '../../../constants/medications';
import { PEPTIDE_PRESETS } from '../../../types';
import StorageChart from './StorageChart';

const MAIN_MEDICATIONS = MEDICATIONS.slice(0, -1); // All except 'other'
const ALL_MEDICATIONS = MEDICATIONS;

const CATEGORIES: { id: StorageCategory; label: string }[] = [
  { id: 'glp1', label: 'GLP-1' },
  { id: 'peptide', label: 'Peptide' },
  { id: 'other', label: 'Other' },
];

const STORAGE_TYPES: { id: StorageType; label: string }[] = [
  { id: 'vial', label: 'Vial' },
  { id: 'pen', label: 'Pen' },
  { id: 'powder', label: 'Powder' },
];

const GLP1_COLORS = [
  '#9C7BD3', // Semaglutide
  '#4ADEA8', // Tirzepatide
  '#F59E0B', // Retatrutide
  '#EF4444', // Cagrilintide
  '#3B82F6', // Liraglutide
  '#94A3B8', // Dulaglutide
  '#6B7280', // Custom/Other
];

const getStorageItemColor = (item: MedicationStorage, glp1MedicationOrder: string[] = []): string => {
  if (item.category === 'glp1') {
    // First try to match by exact medication name in the logged order
    let medIndex = glp1MedicationOrder.indexOf(item.medicationName);
    if (medIndex === -1) {
      // Try partial match with medication name from logs
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

const PEPTIDE_CATEGORY_COLORS: Record<PeptideCategory, string> = {
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

const PEPTIDE_CATEGORY_LABELS: Record<PeptideCategory, string> = {
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

const PEPTIDE_CATEGORIES: PeptideCategory[] = [
  'healing', 'growth_hormone', 'fat_loss', 'muscle', 'skin', 'longevity', 'immune', 'cognitive', 'other'
];


interface StorageCardProps {
  medicationStorage: MedicationStorage[];
  glp1Entries?: GLP1Entry[];
  onAddStorage: (item: MedicationStorage) => void;
  onUpdateStorage: (item: MedicationStorage) => void;
  onDeleteStorage: (id: string) => void;
  unitSystem?: 'metric' | 'imperial';
  isModalOpen?: boolean;
  onOpenModal?: () => void;
  onCloseModal?: () => void;
  useWheelForDate?: boolean;
}

const StorageCard: React.FC<StorageCardProps> = ({
  medicationStorage,
  glp1Entries = [],
  onAddStorage,
  onUpdateStorage,
  onDeleteStorage,
  unitSystem = 'metric',
  isModalOpen,
  onOpenModal,
  onCloseModal,
  useWheelForDate = true,
}) => {
  const { isDarkMode } = useTheme();
  const { bigCard, bigCardText, smallCard, text, modal, modalText, input: inputStyle, inputButton, primaryButton, textarea, segmentButton } = useThemeStyles();
  const [selectedCategory, setSelectedCategory] = useState<StorageCategory | 'all'>('all');
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicationStorage | null>(null);
  const [confirmAction, setConfirmAction] = useState<'delete' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'purchase' | 'expiry'>('purchase');
  const [showMedicationPicker, setShowMedicationPicker] = useState(false);
  const [showPeptidePicker, setShowPeptidePicker] = useState(false);
  const [peptideSearchQuery, setPeptideSearchQuery] = useState('');

  // Get unique medication order from logged entries (matches Medication Chart)
  const glp1MedicationOrder = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    glp1Entries.forEach(entry => {
      if (!seen.has(entry.medication)) {
        seen.add(entry.medication);
        order.push(entry.medication);
      }
    });
    return order;
  }, [glp1Entries]);

  const openStorageModal = () => {
    onOpenModal?.();
  };

  const closeStorageModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalClosing(false);
      onCloseModal?.();
    }, 200);
  };

  const openDatePicker = (type: 'purchase' | 'expiry') => {
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isModalOpen]);

  const [formData, setFormData] = useState({
    medicationName: '',
    category: 'glp1' as StorageCategory,
    type: 'vial' as StorageType,
    dosagePerUnit: '',
    initialUnits: '',
    remainingUnits: '',
    unitCost: '',
    purchaseDate: timeService.todayString(),
    expiryDate: '',
    notes: '',
    isActive: true,
  });

  const filteredStorage = useMemo(() => {
    if (selectedCategory === 'all') return medicationStorage;
    return medicationStorage.filter(item => item.category === selectedCategory);
  }, [medicationStorage, selectedCategory]);

  const metrics = useMemo(() => {
    const active = filteredStorage.filter(item => item.isActive);
    const totalItems = filteredStorage.length;
    const totalInitial = filteredStorage.reduce((sum, item) => sum + item.initialUnits, 0);
    const totalRemaining = filteredStorage.reduce((sum, item) => sum + item.remainingUnits, 0);
    const totalCostRemaining = filteredStorage.reduce((sum, item) => sum + (item.remainingUnits * item.unitCost), 0);
    const totalUsed = totalInitial - totalRemaining;
    const avgCostPerUnit = totalRemaining > 0 ? totalCostRemaining / totalRemaining : 0;

    return {
      totalItems,
      activeItems: active.length,
      totalRemaining,
      costRemaining: totalCostRemaining,
      unitsUsed: totalUsed,
      avgCostPerUnit,
    };
  }, [filteredStorage]);

  const openAddModal = () => {
    setEditingItem(null);
    setConfirmAction(null);
    setFormData({
      medicationName: '',
      category: 'glp1',
      type: 'vial',
      dosagePerUnit: '',
      initialUnits: '',
      remainingUnits: '',
      unitCost: '',
      purchaseDate: timeService.todayString(),
      expiryDate: '',
      notes: '',
      isActive: true,
    });
    openStorageModal();
  };

  const openEditModal = (item: MedicationStorage) => {
    setEditingItem(item);
    setConfirmAction(null);
    setFormData({
      medicationName: item.medicationName,
      category: item.category,
      type: item.type,
      dosagePerUnit: item.dosagePerUnit?.toString() || '',
      initialUnits: item.initialUnits.toString(),
      remainingUnits: item.remainingUnits.toString(),
      unitCost: item.unitCost.toString(),
      purchaseDate: item.purchaseDate,
      expiryDate: item.expiryDate || '',
      notes: item.notes,
      isActive: item.isActive,
    });
    openStorageModal();
  };

  const handleSave = (closeAfterSave: boolean = true) => {
    const now = new Date().toISOString();
    const item: MedicationStorage = {
      id: editingItem?.id || crypto.randomUUID(),
      medicationName: formData.medicationName,
      category: formData.category,
      type: formData.type,
      dosagePerUnit: parseFloat(formData.dosagePerUnit) || 0,
      initialUnits: parseFloat(formData.initialUnits) || 0,
      remainingUnits: parseFloat(formData.remainingUnits) || 0,
      unitCost: parseFloat(formData.unitCost) || 0,
      purchaseDate: formData.purchaseDate,
      expiryDate: formData.expiryDate || undefined,
      notes: formData.notes,
      isActive: formData.isActive,
      createdAt: editingItem?.createdAt || now,
      updatedAt: now,
    };

    if (editingItem) {
      onUpdateStorage(item);
      closeStorageModal();
    } else {
      onAddStorage(item);
      if (closeAfterSave) {
        closeStorageModal();
      } else {
        setFormData({
          medicationName: '',
          category: 'glp1',
          type: 'vial',
          dosagePerUnit: '',
          initialUnits: '',
          remainingUnits: '',
          unitCost: '',
          purchaseDate: timeService.todayString(),
          expiryDate: '',
          notes: '',
          isActive: true,
        });
        setEditingItem(null);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className={bigCard}>
      <div className="mb-3">
        <h1 className={bigCardText.title}>Medication Storage</h1>
      </div>
      
      <div className="border-t border-[#B19CD9]/20 mb-3"></div>

      {/* Metrics */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
        <div className={smallCard}>
          <p className={text.label}>Total Items</p>
          <p className={text.value}>{metrics.totalItems}</p>
        </div>
        <div className={smallCard}>
          <p className={text.label}>In Stock</p>
          <p className={text.value}>{metrics.activeItems}</p>
        </div>
        <div className={smallCard}>
          <p className={text.label}>Units Left</p>
          <p className={text.value}>{metrics.totalRemaining.toFixed(1)}</p>
        </div>
        <div className={smallCard}>
          <p className={text.label}>Cost Left</p>
          <p className={text.value}>{formatCurrency(metrics.costRemaining)}</p>
        </div>
        <div className={smallCard}>
          <p className={text.label}>Used</p>
          <p className={text.value}>{metrics.unitsUsed.toFixed(1)}</p>
        </div>
        <div className={smallCard}>
          <p className={text.label}>$/Unit</p>
          <p className={text.value}>{formatCurrency(metrics.avgCostPerUnit)}</p>
        </div>
      </div>

      <div className="border-t border-[#B19CD9]/20 my-3"></div>

      {/* Category Tabs */}
      <div className="flex gap-2 pb-2 mb-3">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`flex-1 py-2 text-xs rounded-lg transition-all ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_10px_rgba(177,156,217,0.4)]'
              : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            type="button"
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex-1 py-2 text-xs rounded-lg transition-all ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_10px_rgba(177,156,217,0.4)]'
                : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Storage Overview Chart */}
      <StorageChart storage={medicationStorage} selectedCategory={selectedCategory} glp1MedicationOrder={glp1MedicationOrder} height={260} />

      <div className="border-t border-[#B19CD9]/20 my-3"></div>

      {/* Add Button */}
      <button
        onClick={openAddModal}
        className={`w-full py-2 ${primaryButton}`}
      >
        + Add Storage Item
      </button>

      {/* Storage List - Separate containers for GLP-1, Peptides, Other */}
      {filteredStorage.length > 0 ? (
        <div className="space-y-4 mt-4">
          {/* GLP-1 Card */}
          {(selectedCategory === 'all' || selectedCategory === 'glp1') && filteredStorage.filter(item => item.category === 'glp1').length > 0 && (
            <div className={`rounded-lg border p-3 ${
              isDarkMode 
                ? 'bg-black/20 border-[#B19CD9]/20' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <h3 className={`text-base font-medium ${
                isDarkMode ? 'text-text-primary' : 'text-gray-900'
              }`}>GLP-1</h3>
              <div className="border-t border-[#B19CD9]/20 my-2"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredStorage.filter(item => item.category === 'glp1').map(item => {
                  const itemColor = getStorageItemColor(item, glp1MedicationOrder);
                  return (
                    <div 
                      key={item.id}
                      onClick={() => openEditModal(item)}
                      className={`rounded-lg p-3 border cursor-pointer transition-all ${
                        isDarkMode 
                          ? 'bg-black/20 border-[#B19CD9]/20 hover:border-[#B19CD9]/40' 
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ borderLeftWidth: '3px', borderLeftColor: itemColor }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.medicationName}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.type === 'vial' ? 'bg-purple-500/20 text-purple-400' :
                          item.type === 'pen' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {STORAGE_TYPES.find(t => t.id === item.type)?.label}
                        </span>
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="flex items-center justify-between">
                          <span>{item.remainingUnits}/{item.initialUnits} units</span>
                          <span className="text-[#4ADEA8]">${item.unitCost.toFixed(2)}/unit</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Peptides Card */}
          {(selectedCategory === 'all' || selectedCategory === 'peptide') && filteredStorage.filter(item => item.category === 'peptide').length > 0 && (
            <div className={`rounded-lg border p-3 ${
              isDarkMode 
                ? 'bg-black/20 border-[#B19CD9]/20' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <h3 className={`text-base font-medium ${
                isDarkMode ? 'text-text-primary' : 'text-gray-900'
              }`}>Peptides</h3>
              <div className="border-t border-[#B19CD9]/20 my-2"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredStorage.filter(item => item.category === 'peptide').map(item => {
                  const itemColor = getStorageItemColor(item, glp1MedicationOrder);
                  return (
                    <div 
                      key={item.id}
                      onClick={() => openEditModal(item)}
                      className={`rounded-lg p-3 border cursor-pointer transition-all ${
                        isDarkMode 
                          ? 'bg-black/20 border-[#B19CD9]/20 hover:border-[#B19CD9]/40' 
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ borderLeftWidth: '3px', borderLeftColor: itemColor }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.medicationName}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.type === 'vial' ? 'bg-purple-500/20 text-purple-400' :
                          item.type === 'pen' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {STORAGE_TYPES.find(t => t.id === item.type)?.label}
                        </span>
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="flex items-center justify-between">
                          <span>{item.remainingUnits}/{item.initialUnits} units</span>
                          <span className="text-[#4ADEA8]">${item.unitCost.toFixed(2)}/unit</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Others Card */}
          {(selectedCategory === 'all' || selectedCategory === 'other') && filteredStorage.filter(item => item.category === 'other').length > 0 && (
            <div className={`rounded-lg border p-3 ${
              isDarkMode 
                ? 'bg-black/20 border-[#B19CD9]/20' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <h3 className={`text-base font-medium ${
                isDarkMode ? 'text-text-primary' : 'text-gray-900'
              }`}>Other</h3>
              <div className="border-t border-[#B19CD9]/20 my-2"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredStorage.filter(item => item.category === 'other').map(item => {
                  const itemColor = getStorageItemColor(item, glp1MedicationOrder);
                  return (
                    <div 
                      key={item.id}
                      onClick={() => openEditModal(item)}
                      className={`rounded-lg p-3 border cursor-pointer transition-all ${
                        isDarkMode 
                          ? 'bg-black/20 border-[#B19CD9]/20 hover:border-[#B19CD9]/40' 
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ borderLeftWidth: '3px', borderLeftColor: itemColor }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.medicationName}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.type === 'vial' ? 'bg-purple-500/20 text-purple-400' :
                          item.type === 'pen' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {STORAGE_TYPES.find(t => t.id === item.type)?.label}
                        </span>
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="flex items-center justify-between">
                          <span>{item.remainingUnits}/{item.initialUnits} units</span>
                          <span className="text-[#4ADEA8]">${item.unitCost.toFixed(2)}/unit</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mt-3">
            No storage items. Click "Add" to track your medications.
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div 
            className={`absolute inset-0 bg-black/60 ${isModalClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}
            style={{ backdropFilter: 'blur(8px)' }}
            onClick={closeStorageModal} 
          />
          <div className={`relative rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 overflow-y-auto max-h-[90vh] ${modal} ${isModalClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className={`text-lg font-semibold ${modalText.title}`}>
                {editingItem ? 'Edit Storage Item' : 'Add Storage Item'}
              </h2>
              {editingItem && !confirmAction && (
                <button
                  onClick={() => setConfirmAction('delete')}
                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            <div className="border-t border-[#B19CD9]/20 mb-4"></div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                    Category
                  </label>
                  <div className="flex gap-1">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id, medicationName: '' })}
                        className={segmentButton(formData.category === cat.id)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                    Type
                  </label>
                  <div className="flex gap-1">
                    {STORAGE_TYPES.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.id })}
                        className={segmentButton(formData.type === type.id)}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category-specific input with dosage */}
              <div className="grid grid-cols-2 gap-3">
                {/* Medication/Peptide/Other name */}
                {formData.category === 'glp1' && (
                  <div>
                    <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                      Medication
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMedicationPicker(true)}
                      className={inputButton}
                    >
                      {formData.medicationName || 'Select medication'}
                    </button>
                  </div>
                )}

                {formData.category === 'peptide' && (
                  <div>
                    <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                      Peptide
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPeptidePicker(true)}
                      className={inputButton}
                    >
                      {formData.medicationName || 'Select peptide'}
                    </button>
                  </div>
                )}

                {formData.category === 'other' && (
                  <div>
                    <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                      Medication Name
                    </label>
                    <input
                      type="text"
                      value={formData.medicationName}
                      onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                      className={inputStyle}
                      placeholder="e.g., Metformin, Vitamins"
                    />
                  </div>
                )}

                {/* Dosage field beside medication */}
                {formData.type === 'vial' && (
                  <div>
                    <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                      Strength (mg)
                    </label>
                    <input
                      type="number"
                      value={formData.dosagePerUnit}
                      onChange={(e) => setFormData({ ...formData, dosagePerUnit: e.target.value })}
                      className={inputStyle}
                      placeholder="e.g., 0.25"
                      min="0"
                      step="0.1"
                    />
                  </div>
                )}

                {(formData.type === 'pen' || formData.type === 'powder') && (
                  <div>
                    <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                      Strength (mg)
                    </label>
                    <input
                      type="number"
                      value={formData.dosagePerUnit}
                      onChange={(e) => setFormData({ ...formData, dosagePerUnit: e.target.value })}
                      className={inputStyle}
                      placeholder={formData.type === 'pen' ? "e.g., 0.25" : "e.g., 10"}
                      min="0"
                      step="0.1"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                    Initial Units
                  </label>
                  <input
                    type="number"
                    value={formData.initialUnits}
                    onChange={(e) => setFormData({ ...formData, initialUnits: e.target.value })}
                    className={inputStyle}
                    placeholder="10"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                    Remaining Units
                  </label>
                  <input
                    type="number"
                    value={formData.remainingUnits}
                    onChange={(e) => setFormData({ ...formData, remainingUnits: e.target.value })}
                    className={inputStyle}
                    placeholder="5"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                    Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    className={inputStyle}
                    placeholder="25.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                    Purchase Date
                  </label>
                  <button
                    type="button"
                    onClick={() => openDatePicker('purchase')}
                    className={inputButton}
                  >
                    {formData.purchaseDate || 'Select date'}
                  </button>
                </div>
                <div>
                  <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                    Expiry Date (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => openDatePicker('expiry')}
                    className={inputButton}
                  >
                    {formData.expiryDate || 'Select date'}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={textarea}
                  placeholder="Optional notes..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-[#B19CD9]/20">
              {confirmAction && editingItem ? (
                <>
                  <button
                    onClick={() => {
                      if (confirmAction === 'delete') {
                        onDeleteStorage(editingItem.id);
                        closeStorageModal();
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 px-4 py-2 rounded-lg border border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10 transition-all text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={closeStorageModal}
                    className="flex-1 py-2 border border-[#B19CD9]/30 rounded-lg text-[#B19CD9] hover:bg-[#B19CD9]/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={!formData.medicationName || !formData.initialUnits}
                    className="flex-1 py-2 bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-medium rounded-lg hover:shadow-[0_0_15px_rgba(177,156,217,0.4)] transition-all disabled:opacity-50"
                  >
                    {editingItem ? 'Update' : 'Add'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {showDatePicker && (
        useWheelForDate ? (
          <DateWheelPickerModal
            isOpen={showDatePicker}
            value={datePickerType === 'purchase' ? formData.purchaseDate : (formData.expiryDate || timeService.todayString())}
            onChange={(date) => {
              if (datePickerType === 'purchase') {
                setFormData({ ...formData, purchaseDate: date });
              } else {
                setFormData({ ...formData, expiryDate: date });
              }
              setShowDatePicker(false);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        ) : (
          <CalendarPickerModal
            isOpen={showDatePicker}
            value={datePickerType === 'purchase' ? formData.purchaseDate : (formData.expiryDate || timeService.todayString())}
            onChange={(date) => {
              if (datePickerType === 'purchase') {
                setFormData({ ...formData, purchaseDate: date });
              } else {
                setFormData({ ...formData, expiryDate: date });
              }
              setShowDatePicker(false);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        )
      )}

      {/* Medication Picker Modal */}
      {showMedicationPicker && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-fade-in" style={{ backdropFilter: 'blur(8px)' }} onClick={() => setShowMedicationPicker(false)} />
          <div className={`relative rounded-2xl shadow-2xl w-full max-w-xs p-4 max-h-[80vh] overflow-y-auto ${modal} modal-content-fade-in`}>
            <h3 className={`text-lg font-semibold mb-3 ${modalText.title}`}>Select Medication</h3>
            <div className="space-y-2 mb-3">
              {MAIN_MEDICATIONS.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, medicationName: med.name });
                    setShowMedicationPicker(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
                    formData.medicationName === med.name
                      ? 'bg-[#B19CD9]/30 border border-[#B19CD9]'
                      : 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10'
                  }`}
                >
                  <span className={modalText.value}>{med.name}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-[#B19CD9]/20 pt-3">
              <label className={`block text-xs font-medium mb-2 ${modalText.label}`}>More Options</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {ALL_MEDICATIONS.filter(m => !MAIN_MEDICATIONS.find(main => main.id === m.id)).map((med) => (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, medicationName: med.name });
                      setShowMedicationPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
                      formData.medicationName === med.name
                        ? 'bg-[#B19CD9]/30 border border-[#B19CD9]'
                        : 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10'
                    }`}
                  >
                    <span className={modalText.value}>{med.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowMedicationPicker(false)}
              className="w-full mt-3 py-2 border border-[#B19CD9]/30 rounded-lg text-[#B19CD9] hover:bg-[#B19CD9]/10 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Peptide Picker Modal */}
      {showPeptidePicker && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-fade-in" style={{ backdropFilter: 'blur(8px)' }} onClick={() => setShowPeptidePicker(false)} />
          <div className={`relative rounded-2xl shadow-2xl w-full max-w-md p-4 max-h-[80vh] flex flex-col ${modal} modal-content-fade-in`}>
            <h3 className={`text-lg font-semibold mb-3 ${modalText.title}`}>Select Peptide</h3>
            
            {/* Search Bar */}
            <input
              type="text"
              value={peptideSearchQuery}
              onChange={(e) => setPeptideSearchQuery(e.target.value)}
              placeholder="Search peptides..."
              className={inputStyle}
            />

            {/* Peptide List grouped by category */}
            <div className="flex-1 overflow-y-auto mt-3 space-y-4">
              {PEPTIDE_CATEGORIES.map(category => {
                const filteredPeptides = PEPTIDE_PRESETS.filter(p => 
                  p.name.toLowerCase().includes(peptideSearchQuery.toLowerCase()) ||
                  p.description.toLowerCase().includes(peptideSearchQuery.toLowerCase())
                ).filter(p => p.category === category);
                
                if (filteredPeptides.length === 0) return null;
                
                const categoryColor = PEPTIDE_CATEGORY_COLORS[category];
                
                return (
                  <div key={category}>
                    <p 
                      className="text-xs font-semibold uppercase tracking-wide mb-2" 
                      style={{ color: categoryColor }}
                    >
                      {PEPTIDE_CATEGORY_LABELS[category]}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {filteredPeptides.map((peptide) => (
                        <button
                          key={peptide.name}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, medicationName: peptide.name });
                            setShowPeptidePicker(false);
                            setPeptideSearchQuery('');
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left w-full ${
                            formData.medicationName === peptide.name
                              ? 'bg-[#B19CD9]/30 border border-[#B19CD9]'
                              : 'bg-black/20 border-transparent hover:bg-[#B19CD9]/10'
                          }`}
                        >
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: PEPTIDE_CATEGORY_COLORS[peptide.category] }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-white">{peptide.name}</p>
                            <p className="text-xs text-gray-400 truncate">{peptide.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {PEPTIDE_PRESETS.filter(p => 
                p.name.toLowerCase().includes(peptideSearchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(peptideSearchQuery.toLowerCase())
              ).length === 0 && (
                <p className="text-center py-4 text-gray-400">No peptides found</p>
              )}
            </div>
            
            <button
              onClick={() => {
                setShowPeptidePicker(false);
                setPeptideSearchQuery('');
              }}
              className="w-full mt-3 py-2 border border-[#B19CD9]/30 rounded-lg text-[#B19CD9] hover:bg-[#B19CD9]/10 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StorageCard;
