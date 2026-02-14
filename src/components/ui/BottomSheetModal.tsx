import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

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
}

const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  isOpen,
  title,
  options,
  value,
  onSelect,
  onClose,
}) => {
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
    onClose();
  };

  if (!isVisible) return null;

  const modal = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/60 ${
          isClosing
            ? 'backdrop-fade-out'
            : 'backdrop-fade-in'
        }`}
        style={{ backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm">
        <div
          className={`rounded-2xl border border-[#B19CD9]/30 shadow-2xl bg-gradient-to-b from-[#1a1625]/95 to-[#0d0a15]/95 p-4 transition-all ${
            isClosing
              ? 'modal-fade-out'
              : 'modal-content-fade-in'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              {title}
            </h3>
          </div>
          <div className="border-t border-[#B19CD9]/20 mb-4"></div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  value === option.value
                    ? 'bg-[#B19CD9]/30 border border-[#B19CD9] text-white'
                    : 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10 text-gray-300'
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
