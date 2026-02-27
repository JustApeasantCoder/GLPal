import React from 'react';
import { MedicationStorage } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';
import { getStorageItemColor, getStorageTypeColor, STORAGE_TYPES } from './storageConstants';

interface StorageItemCardProps {
  item: MedicationStorage;
  itemColor: string;
  onClick: () => void;
}

const StorageItemCard: React.FC<StorageItemCardProps> = ({ item, itemColor, onClick }) => {
  const { isDarkMode } = useTheme();

  return (
    <div 
      onClick={onClick}
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
        <span className={`text-xs px-2 py-0.5 rounded ${getStorageTypeColor(item.type)}`}>
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
};

export default StorageItemCard;
