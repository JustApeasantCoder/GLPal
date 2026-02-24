import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import WheelPicker from '../../../shared/components/WheelPicker';
import { useTheme } from '../../../contexts/ThemeContext';

interface WeightWheelPickerModalProps {
  isOpen: boolean;
  onSave: (value: string) => void;
  onClose: () => void;
  min?: number;
  max?: number;
  label?: string;
  decimals?: number;
  defaultValue?: string;
}

const WeightWheelPickerModal: React.FC<WeightWheelPickerModalProps> = ({
  isOpen,
  onSave,
  onClose,
  min = 0,
  max = 500,
  label = 'Select Value',
  decimals = 1,
  defaultValue,
}) => {
  const { isDarkMode } = useTheme();
  const getInitialValue = () => defaultValue || '1';
  const [localValue, setLocalValue] = useState(defaultValue || '1');
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      setLocalValue(defaultValue || '1');
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 200);
    }
  }, [isOpen]);

  const parsedValue = useMemo(() => {
    const num = parseFloat(localValue);
    const whole = Math.floor(num);
    const decimal = Math.round((num - whole) * Math.pow(10, decimals));
    return { whole, decimal };
  }, [localValue, decimals]);

  const wholeNumbers = useMemo(() => {
    return Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
  }, [min, max]);

  const decimalOptions = useMemo(() => {
    return Array.from({ length: Math.pow(10, decimals) }, (_, i) => 
      String(i).padStart(decimals, '0')
    );
  }, [decimals]);

  const handleChange = (type: 'whole' | 'decimal', newValue: string) => {
    let newWhole = parsedValue.whole;
    let newDecimal = parsedValue.decimal;

    if (type === 'whole') {
      newWhole = parseInt(newValue);
    } else {
      newDecimal = parseInt(newValue);
    }

    const formatted = `${newWhole}.${String(newDecimal).padStart(decimals, '0')}`;
    setLocalValue(formatted);
  };

  const handleDone = () => {
    onSave(localValue);
    onClose();
  };

  if (!isVisible) return null;

  const modal = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/40'} ${
          isClosing
            ? 'backdrop-fade-out'
            : 'backdrop-fade-in'
        }`}
        style={{ backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm">
        <div
          className={`relative isolate rounded-2xl border shadow-2xl p-6 max-h-[90vh] overflow-y-auto transition-all ${
            isClosing
              ? 'modal-fade-out'
              : 'modal-content-fade-in'
          } ${
            isDarkMode
              ? 'border-[#B19CD9]/30 bg-gradient-to-b from-[#1a1625]/95 to-[#0d0a15]/95'
              : 'border-gray-300 bg-gradient-to-b from-white to-gray-50'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {label}
            </h3>
          </div>
          <div className={`border-t mb-3 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

          <div className="flex items-center justify-center gap-2 mb-4 px-4">
            <WheelPicker
              value={String(parsedValue.whole)}
              onChange={(v) => handleChange('whole', v)}
              options={wholeNumbers}
            />

            <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>.</span>

            <WheelPicker
              value={String(parsedValue.decimal).padStart(decimals, '0')}
              onChange={(v) => handleChange('decimal', v)}
              options={decimalOptions}
            />
          </div>

          <div className={`border-t my-3 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl border transition-all font-medium ${
                isDarkMode
                  ? 'border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>

            <button
              onClick={handleDone}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-medium hover:shadow-[0_0_20px_rgba(177,156,217,0.5)] transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default WeightWheelPickerModal;
