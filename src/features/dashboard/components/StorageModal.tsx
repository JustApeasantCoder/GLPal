import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { MedicationStorage, StorageCategory, StorageType } from '../../../types';
import { useThemeStyles, useTheme } from '../../../contexts/ThemeContext';
import { timeService } from '../../../core/timeService';
import DateWheelPickerModal from '../../../shared/components/DateWheelPickerModal';
import CalendarPickerModal from '../../../shared/components/CalendarPickerModal';
import { MEDICATIONS } from '../../../constants/medications';
import { PEPTIDE_PRESETS } from '../../../types';
import { CATEGORIES, STORAGE_TYPES, PEPTIDE_CATEGORIES, PEPTIDE_CATEGORY_COLORS, PEPTIDE_CATEGORY_LABELS } from './storageConstants';

const MAIN_MEDICATIONS = MEDICATIONS.slice(0, -1);
const ALL_MEDICATIONS = MEDICATIONS;

interface StorageModalProps {
  isOpen: boolean;
  isClosing: boolean;
  editingItem: MedicationStorage | null;
  onClose: () => void;
  onSave: (item: MedicationStorage, closeAfterSave: boolean) => void;
  onDelete: (id: string) => void;
  useWheelForDate?: boolean;
}

interface FormData {
  medicationName: string;
  category: StorageCategory;
  type: StorageType;
  dosagePerUnit: string;
  initialUnits: string;
  remainingUnits: string;
  unitCost: string;
  purchaseDate: string;
  expiryDate: string;
  notes: string;
  isActive: boolean;
}

const getInitialFormData = (editingItem: MedicationStorage | null): FormData => {
  if (editingItem) {
    return {
      medicationName: editingItem.medicationName,
      category: editingItem.category,
      type: editingItem.type,
      dosagePerUnit: editingItem.dosagePerUnit?.toString() || '',
      initialUnits: editingItem.initialUnits.toString(),
      remainingUnits: editingItem.remainingUnits.toString(),
      unitCost: editingItem.unitCost.toString(),
      purchaseDate: editingItem.purchaseDate,
      expiryDate: editingItem.expiryDate || '',
      notes: editingItem.notes,
      isActive: editingItem.isActive,
    };
  }
  return {
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
  };
};

const StorageModal: React.FC<StorageModalProps> = ({
  isOpen,
  isClosing,
  editingItem,
  onClose,
  onSave,
  onDelete,
  useWheelForDate = true,
}) => {
  const { isDarkMode } = useTheme();
  const { modal, modalText, modalContainer, modalBackdrop, modalSmall, cancelButton, saveButton, deleteButton, input: inputStyle, inputButton, textarea, segmentButton } = useThemeStyles();
  
  const [formData, setFormData] = useState<FormData>(getInitialFormData(null));
  const [confirmAction, setConfirmAction] = useState<'delete' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'purchase' | 'expiry'>('purchase');
  const [showMedicationPicker, setShowMedicationPicker] = useState(false);
  const [showPeptidePicker, setShowPeptidePicker] = useState(false);
  const [peptideSearchQuery, setPeptideSearchQuery] = useState('');

  useEffect(() => {
    setFormData(getInitialFormData(editingItem));
    setConfirmAction(null);
  }, [editingItem, isOpen]);

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

    onSave(item, closeAfterSave);
    
    if (!closeAfterSave && !editingItem) {
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
    }
  };

  const openDatePicker = (type: 'purchase' | 'expiry') => {
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  if (!isOpen) return null;

  return (
    <>
      {ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div 
            className={modalBackdrop(isClosing)}
            style={{ backdropFilter: 'blur(8px)' }}
            onClick={onClose} 
          />
          <div className={`relative rounded-2xl ${modal} ${modalContainer} ${isClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
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

              <div className="border-t border-[#B19CD9]/20 my-3"></div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="border-t border-[#B19CD9]/20 my-3"></div>

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
              <button
                onClick={onClose}
                className={cancelButton(isDarkMode)}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={!formData.medicationName || !formData.initialUnits}
                className={`${saveButton} disabled:opacity-50`}
              >
                {editingItem ? 'Save' : 'Add'}
              </button>
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

      {showMedicationPicker && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className={modalBackdrop(false)} style={{ backdropFilter: 'blur(8px)' }} onClick={() => setShowMedicationPicker(false)} />
          <div className={`relative rounded-2xl ${modal} ${modalSmall} max-h-[80vh] overflow-y-auto modal-content-fade-in`}>
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
              className={`w-full mt-3 py-2 rounded-lg border transition-colors text-sm ${isDarkMode ? 'border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}

      {showPeptidePicker && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className={modalBackdrop(false)} style={{ backdropFilter: 'blur(8px)' }} onClick={() => setShowPeptidePicker(false)} />
          <div className={`relative rounded-2xl ${modal} max-w-md p-4 max-h-[80vh] flex flex-col ${modalContainer} modal-content-fade-in`}>
            <h3 className={`text-lg font-semibold mb-3 ${modalText.title}`}>Select Peptide</h3>
            
            <input
              type="text"
              value={peptideSearchQuery}
              onChange={(e) => setPeptideSearchQuery(e.target.value)}
              placeholder="Search peptides..."
              className={inputStyle}
            />

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
              className={`w-full mt-3 py-2 rounded-lg border transition-colors text-sm ${isDarkMode ? 'border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}

      {confirmAction && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <div className={modalBackdrop(false)} style={{ backdropFilter: 'blur(8px)' }} onClick={() => setConfirmAction(null)} />
          <div className={`relative rounded-2xl ${modal} ${modalSmall} border border-red-500/30 modal-content-fade-in`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Delete Storage Item?</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className={cancelButton(isDarkMode)}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingItem) {
                    onDelete(editingItem.id);
                    onClose();
                  }
                }}
                className={deleteButton(isDarkMode)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default StorageModal;
