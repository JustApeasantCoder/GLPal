import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface BottomSheetOption {
  value: string | number;
  label: string;
}

interface BottomSheetModalProps {
  isOpen: boolean;
  title: string;
  options: BottomSheetOption[];
  value: string | number;
  onSelect: (value: string | number) => void;
  onClose: () => void;
  closeOnSelect?: boolean;
  closeOnBackdrop?: boolean;
}

const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  isOpen,
  title,
  options,
  value,
  onSelect,
  onClose,
  closeOnSelect = true,
  closeOnBackdrop = true,
}) => {
  const { isDarkMode } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 200);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string | number) => {
    onSelect(optionValue);
    if (closeOnSelect) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const modal = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {closeOnBackdrop && (
      <div
        className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/40'} ${
          isClosing
            ? 'backdrop-fade-out'
            : 'backdrop-fade-in'
        }`}
        style={{ backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      )}

      <div className="relative w-full max-w-sm">
        <div
          className={`rounded-2xl border shadow-2xl p-4 max-h-[90vh] overflow-y-auto transition-all ${
            isClosing
              ? 'modal-fade-out'
              : 'modal-content-fade-in'
          } ${
            isDarkMode
              ? 'border-[#B19CD9]/30 bg-gradient-to-b from-[#1a1625]/95 to-[#0d0a15]/95'
              : 'border-gray-200 bg-gradient-to-b from-white to-gray-50'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h3>
          </div>
          <div className={`border-t mb-3 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  value === option.value
                    ? isDarkMode
                      ? 'bg-[#B19CD9]/30 border border-[#B19CD9] text-white'
                      : 'bg-[#B19CD9]/20 border border-[#B19CD9] text-gray-900'
                    : isDarkMode
                      ? 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10 text-gray-300'
                      : 'bg-gray-100 border border-transparent hover:bg-gray-200 text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default BottomSheetModal;
