import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import WheelPicker from './WheelPicker';
import { useTheme } from '../../contexts/ThemeContext';

interface DoseWheelPickerModalProps {
  isOpen: boolean;
  onSave: (value: string) => void;
  onClose: () => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  decimals?: number;
  defaultValue?: string;
  presets?: string[];
}

const DoseWheelPickerModal: React.FC<DoseWheelPickerModalProps> = ({
  isOpen,
  onSave,
  onClose,
  min = 0,
  max = 100,
  step = 1,
  label = 'Select Dose',
  decimals = 2,
  defaultValue,
  presets,
}) => {
  const { isDarkMode } = useTheme();
  const [localValue, setLocalValue] = useState(defaultValue || '0.25');
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      setLocalValue(defaultValue || '0.25');
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 200);
    }
  }, [isOpen, defaultValue]);

  const parsedValue = useMemo(() => {
    const num = parseFloat(localValue) || 0;
    const whole = Math.floor(num);
    const decimal = Math.round((num - whole) * Math.pow(10, decimals));
    return { whole, decimal };
  }, [localValue, decimals]);

  const wholeNumbers = useMemo(() => {
    return Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => String(min + i * step));
  }, [min, max, step]);

  const decimalOptions = useMemo(() => {
    const options: string[] = [];
    const step = decimals === 2 ? 1 : 1;
    for (let i = 0; i < Math.pow(10, decimals); i += step) {
      options.push(String(i).padStart(decimals, '0'));
    }
    return options;
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
          className={`relative isolate rounded-2xl border shadow-2xl p-6 max-h-[90vh] overflow-y-auto transition-all ${
            isDarkMode 
              ? 'border-[#B19CD9]/30 bg-gradient-to-b from-[#1a1625]/95 to-[#0d0a15]/95'
              : 'border-gray-200 bg-white'
          } ${
            isClosing
              ? 'modal-fade-out'
              : 'modal-content-fade-in'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {label}
            </h3>
          </div>
          <div className={`border-t mb-3 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

          {presets && presets.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {presets.map((val) => {
                const isSelected = localValue === val;
                return (
                  <button
                    key={`preset-${val}`}
                    type="button"
                    onClick={() => setLocalValue(val)}
                    className={`px-2 py-1.5 text-xs rounded-lg transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                        : isDarkMode
                          ? 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mb-4 px-2">
            <WheelPicker
              value={String(parsedValue.whole)}
              onChange={(v) => handleChange('whole', v)}
              options={wholeNumbers}
            />

            <span className={`text-2xl font-bold mt-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>.</span>

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

export default DoseWheelPickerModal;
