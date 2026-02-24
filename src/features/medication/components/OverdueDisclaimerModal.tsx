import React from 'react';
import { useThemeStyles } from '../../../contexts/ThemeContext';

interface OverdueDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const OverdueDisclaimerModal: React.FC<OverdueDisclaimerModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { modal } = useThemeStyles();
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div 
        className="fixed inset-0 bg-black/60" 
        style={{ backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }} 
        onClick={onClose} 
      />
      <div 
        className={`relative rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-2xl p-6 ${modal}`}
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        <h3 className="text-lg font-bold text-white mb-3">Disclaimer</h3>
        <p className="text-sm text-gray-300 mb-4">
          By proceeding, you confirm that you have consulted your healthcare provider regarding any missed doses and understand this app does not provide medical advice.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg bg-gray-600 text-white font-semibold text-sm hover:bg-gray-500 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-[#EF4444] to-[#F87171] text-white font-semibold text-sm hover:scale-[1.02] transition-all"
            style={{ boxShadow: '0 0 20px rgba(239,68,68,0.5)' }}
          >
            I Understand, Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverdueDisclaimerModal;
