import React, { useState, useMemo, useEffect } from 'react';
import { MedicationStorage, StorageCategory, GLP1Entry } from '../../../types';
import { useThemeStyles, useTheme } from '../../../contexts/ThemeContext';
import { timeService } from '../../../core/timeService';
import StorageChart from './StorageChart';
import StorageItemCard from './StorageItemCard';
import StorageModal from './StorageModal';
import { CATEGORIES, getStorageItemColor } from './storageConstants';

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
  const { bigCard, bigCardText, smallCard, text, primaryButton } = useThemeStyles();
  const [selectedCategory, setSelectedCategory] = useState<StorageCategory | 'all'>('all');
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicationStorage | null>(null);

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
    const totalInitialCost = filteredStorage.reduce((sum, item) => sum + (item.initialUnits * item.unitCost), 0);
    const totalUsed = totalInitial - totalRemaining;
    const costUsed = totalInitialCost - totalCostRemaining;
    const avgCostPerUnit = totalRemaining > 0 ? totalCostRemaining / totalRemaining : 0;

    return {
      totalItems,
      activeItems: active.length,
      totalRemaining,
      totalUnits: totalInitial,
      totalCost: totalInitialCost,
      costRemaining: totalCostRemaining,
      costUsed,
      unitsUsed: totalUsed,
      avgCostPerUnit,
    };
  }, [filteredStorage]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isModalOpen]);

  const openAddModal = () => {
    setEditingItem(null);
    onOpenModal?.();
  };

  const openEditModal = (item: MedicationStorage) => {
    setEditingItem(item);
    onOpenModal?.();
  };

  const closeStorageModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalClosing(false);
      onCloseModal?.();
    }, 200);
  };

  const handleSave = (item: MedicationStorage, closeAfterSave: boolean) => {
    if (editingItem) {
      onUpdateStorage(item);
      closeStorageModal();
    } else {
      onAddStorage(item);
      if (closeAfterSave) {
        closeStorageModal();
      } else {
        setEditingItem(null);
      }
    }
  };

  const renderCategorySection = (category: StorageCategory, title: string) => {
    const categoryItems = filteredStorage.filter(item => item.category === category);
    if (categoryItems.length === 0) return null;

    return (
      <div className={`rounded-lg border p-3 ${
        isDarkMode 
          ? 'bg-black/20 border-[#B19CD9]/20' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <h3 className={`text-base font-medium ${
          isDarkMode ? 'text-text-primary' : 'text-gray-900'
        }`}>{title}</h3>
        <div className="border-t border-[#B19CD9]/20 my-2"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {categoryItems.map(item => (
            <StorageItemCard
              key={item.id}
              item={item}
              itemColor={getStorageItemColor(item, glp1MedicationOrder)}
              onClick={() => openEditModal(item)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={bigCard}>
      <div className="mb-3">
        <h1 className={bigCardText.title}>Medication Storage</h1>
      </div>
      
      <div className="border-t border-[#B19CD9]/20 mb-3"></div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
        <div className={smallCard}>
          <p className={text.label}>Total Items</p>
          <p className={text.value}>{metrics.totalItems}</p>
        </div>
        <div className={smallCard}>
          <p className={text.label}>Total Cost</p>
          <p className={text.value}>{formatCurrency(metrics.totalCost)}</p>
        </div>
        <div className={smallCard}>
          <p className={text.label}>Cost Used</p>
          <p className={text.value}>{formatCurrency(metrics.costUsed)}</p>
        </div>
        <div className={smallCard}>
          <p className={text.label}>Total Units</p>
          <p className={text.value}>{Math.round(metrics.totalUnits)}</p>
        </div>
        <div className={smallCard}>
          <p className={text.label}>Units Used</p>
          <p className={text.value}>{Math.round(metrics.unitsUsed)}</p>
        </div>
        <div className={smallCard}>
          <p className={text.label}>Units Left</p>
          <p className={text.value}>{Math.round(metrics.totalRemaining)}</p>
        </div>
      </div>

      <div className="border-t border-[#B19CD9]/20 my-3"></div>

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

      <StorageChart storage={medicationStorage} selectedCategory={selectedCategory} glp1MedicationOrder={glp1MedicationOrder} height={260} />

      <div className="border-t border-[#B19CD9]/20 my-3"></div>

      <button
        onClick={openAddModal}
        className={`w-full py-2 ${primaryButton}`}
      >
        + Add Storage Item
      </button>

      {filteredStorage.length > 0 ? (
        <div className="space-y-4 mt-4">
          {(selectedCategory === 'all' || selectedCategory === 'glp1') && renderCategorySection('glp1', 'GLP-1')}
          {(selectedCategory === 'all' || selectedCategory === 'peptide') && renderCategorySection('peptide', 'Peptides')}
          {(selectedCategory === 'all' || selectedCategory === 'other') && renderCategorySection('other', 'Other')}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mt-3">
            No storage items. Click "Add" to track your medications.
          </p>
        </div>
      )}

      <StorageModal
        isOpen={isModalOpen || false}
        isClosing={isModalClosing}
        editingItem={editingItem}
        onClose={closeStorageModal}
        onSave={handleSave}
        onDelete={onDeleteStorage}
        useWheelForDate={useWheelForDate}
      />
    </div>
  );
};

export default StorageCard;
