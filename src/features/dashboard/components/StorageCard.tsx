import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MedicationStorage, StorageCategory, StorageType } from '../../../types';
import { useThemeStyles } from '../../../contexts/ThemeContext';
import { timeService } from '../../../core/timeService';

interface StorageCardProps {
  medicationStorage: MedicationStorage[];
  onAddStorage: (item: MedicationStorage) => void;
  onUpdateStorage: (item: MedicationStorage) => void;
  onDeleteStorage: (id: string) => void;
  unitSystem?: 'metric' | 'imperial';
  isModalOpen?: boolean;
  onOpenModal?: () => void;
  onCloseModal?: () => void;
}

const CATEGORIES: { id: StorageCategory; label: string }[] = [
  { id: 'glp1', label: 'GLP-1' },
  { id: 'peptide', label: 'Peptide' },
  { id: 'other', label: 'Other' },
];

const STORAGE_TYPES: { id: StorageType; label: string }[] = [
  { id: 'vial', label: 'Vial' },
  { id: 'pen', label: 'Pen' },
  { id: 'bottle', label: 'Bottle' },
  { id: 'package', label: 'Package' },
];

const StorageCard: React.FC<StorageCardProps> = ({
  medicationStorage,
  onAddStorage,
  onUpdateStorage,
  onDeleteStorage,
  unitSystem = 'metric',
  isModalOpen,
  onOpenModal,
  onCloseModal,
}) => {
  const { bigCard, bigCardText, smallCard, text, modal, modalText, input: inputStyle, primaryButton, textarea } = useThemeStyles();
  const [selectedCategory, setSelectedCategory] = useState<StorageCategory | 'all'>('all');
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicationStorage | null>(null);

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
    setFormData({
      medicationName: '',
      category: 'glp1',
      type: 'vial',
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
    setFormData({
      medicationName: item.medicationName,
      category: item.category,
      type: item.type,
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

  const handleSave = () => {
    const now = new Date().toISOString();
    const item: MedicationStorage = {
      id: editingItem?.id || crypto.randomUUID(),
      medicationName: formData.medicationName,
      category: formData.category,
      type: formData.type,
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
    } else {
      onAddStorage(item);
    }
    closeStorageModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this storage item?')) {
      onDeleteStorage(id);
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

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5 pb-2 mb-3">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_10px_rgba(177,156,217,0.4)]'
              : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_10px_rgba(177,156,217,0.4)]'
                : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
        <div className={smallCard}>
          <p className={text.label}>Total</p>
          <p className={text.value}>{metrics.totalItems}</p>
        </div>
        <div className={smallCard}>
          <p className={text.label}>Active</p>
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

      {/* Storage List */}
      {filteredStorage.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredStorage.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-[#B19CD9]/5 rounded-lg border border-[#B19CD9]/10"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    item.category === 'glp1' ? 'bg-blue-500/20 text-blue-400' :
                    item.category === 'peptide' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {CATEGORIES.find(c => c.id === item.category)?.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    item.type === 'vial' ? 'bg-purple-500/20 text-purple-400' :
                    item.type === 'pen' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {STORAGE_TYPES.find(t => t.id === item.type)?.label}
                  </span>
                  <span className={`text-xs ${item.isActive ? 'text-green-400' : 'text-gray-500'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#B19CD9] truncate">{item.medicationName}</p>
                <p className="text-xs text-gray-500">
                  {item.remainingUnits}/{item.initialUnits} units • ${item.unitCost}/unit
                </p>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-1.5 text-xs text-[#B19CD9] hover:bg-[#B19CD9]/10 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <button
            onClick={openAddModal}
            className={primaryButton}
          >
            + Add Storage Item
          </button>
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
            <h2 className={`text-lg font-semibold mb-4 ${modalText.title}`}>
              {editingItem ? 'Edit Storage Item' : 'Add Storage Item'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                  Medication Name
                </label>
                <input
                  type="text"
                  value={formData.medicationName}
                  onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                  className={inputStyle}
                  placeholder="e.g., Ozempic, Tirzepatide"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as StorageCategory })}
                    className={inputStyle}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as StorageType })}
                    className={inputStyle}
                  >
                    {STORAGE_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
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
                <div>
                  <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                    Active
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">In Use</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium ${modalText.label} mb-1`}>
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className={inputStyle}
                  />
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
                onClick={closeStorageModal}
                className="flex-1 py-2 border border-[#B19CD9]/30 rounded-lg text-[#B19CD9] hover:bg-[#B19CD9]/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.medicationName || !formData.initialUnits}
                className={primaryButton}
              >
                {editingItem ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StorageCard;
