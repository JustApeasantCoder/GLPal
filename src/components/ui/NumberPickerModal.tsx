import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import WheelPicker from './WheelPicker';

interface NumberPickerModalProps {
  isOpen: boolean;
  onSave: (value: string) => void;
  onClose: () => void;
  min?: number;
  max?: number;
  label?: string;
  decimals?: number;
  defaultValue?: string;
  secondaryMin?: number;
  secondaryMax?: number;
  secondaryLabel?: string;
  secondaryDefaultValue?: string;
}

const NumberPickerModal: React.FC<NumberPickerModalProps> = ({
  isOpen,
  onSave,
  onClose,
  min = 0,
  max = 100,
  label = 'Select Value',
  decimals = 0,
  defaultValue,
  secondaryMin,
  secondaryMax,
  secondaryLabel,
  secondaryDefaultValue,
}) => {
  const [localValue, setLocalValue] = useState(defaultValue || String(min));
  const [secondaryValue, setSecondaryValue] = useState(secondaryDefaultValue || String(secondaryMin || 0));
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      setLocalValue(defaultValue || String(min));
      setSecondaryValue(secondaryDefaultValue || String(secondaryMin || 0));
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 200);
    }
  }, [isOpen, defaultValue, min, secondaryDefaultValue, secondaryMin]);

  const parsedValue = useMemo(() => {
    const num = parseFloat(localValue) || 0;
    const whole = Math.floor(num);
    const decimal = Math.round((num - whole) * Math.pow(10, decimals));
    return { whole, decimal };
  }, [localValue, decimals]);

  const wholeNumbers = useMemo(() => {
    return Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
  }, [min, max]);

  const secondaryNumbers = useMemo(() => {
    if (secondaryMin === undefined || secondaryMax === undefined) return [];
    return Array.from({ length: secondaryMax - secondaryMin + 1 }, (_, i) => String(secondaryMin + i));
  }, [secondaryMin, secondaryMax]);

  const decimalOptions = useMemo(() => {
    return Array.from({ length: Math.pow(10, decimals) }, (_, i) => 
      String(i).padStart(decimals, '0')
    );
  }, [decimals]);

  const handleChange = (type: 'whole' | 'decimal' | 'secondary', newValue: string) => {
    if (type === 'secondary') {
      setSecondaryValue(newValue);
      return;
    }

    let newWhole = parsedValue.whole;
    let newDecimal = parsedValue.decimal;

    if (type === 'whole') {
      newWhole = parseInt(newValue);
    } else {
      newDecimal = parseInt(newValue);
    }

    const formatted = decimals > 0 
      ? `${newWhole}.${String(newDecimal).padStart(decimals, '0')}`
      : String(newWhole);
    setLocalValue(formatted);
  };

  const handleDone = () => {
    if (secondaryMin !== undefined && secondaryMax !== undefined) {
      onSave(`${localValue}'${secondaryValue}"`);
    } else {
      onSave(localValue);
    }
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
          className={`relative isolate rounded-2xl border border-[#B19CD9]/30 shadow-2xl bg-gradient-to-b from-[#1a1625]/95 to-[#0d0a15]/95 p-6 transition-all ${
            isClosing
              ? 'modal-fade-out'
              : 'modal-content-fade-in'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">
              {label}
            </h3>
          </div>
          <div className="border-t border-[#B19CD9]/20 mb-3"></div>

          <div className="flex items-center justify-center gap-3 mb-4 px-4">
            {/* Primary wheel */}
            {decimals > 0 ? (
              <>
                <WheelPicker
                  value={String(parsedValue.whole)}
                  onChange={(v) => handleChange('whole', v)}
                  options={wholeNumbers}
                />
                <span className="text-white text-2xl font-bold mt-6">.</span>
                <WheelPicker
                  value={String(parsedValue.decimal).padStart(decimals, '0')}
                  onChange={(v) => handleChange('decimal', v)}
                  options={decimalOptions}
                />
              </>
            ) : secondaryMin !== undefined ? (
              <>
                <WheelPicker
                  value={localValue.replace('"', '').replace("'", '')}
                  onChange={(v) => handleChange('whole', v)}
                  options={wholeNumbers}
                />
                <span className="text-white text-2xl font-bold mt-6">'</span>
                <WheelPicker
                  value={secondaryValue}
                  onChange={(v) => handleChange('secondary', v)}
                  options={secondaryNumbers}
                />
                <span className="text-white text-2xl font-bold mt-6">"</span>
              </>
            ) : (
              <WheelPicker
                value={String(parsedValue.whole)}
                onChange={(v) => handleChange('whole', v)}
                options={wholeNumbers}
              />
            )}
          </div>

          <div className="border-t border-[#B19CD9]/20 my-3"></div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
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

export default NumberPickerModal;
