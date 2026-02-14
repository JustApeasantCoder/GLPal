import React, { useState, useMemo, useEffect } from 'react';
import WheelPicker from './WheelPicker';

interface DateWheelPickerModalProps {
  isOpen: boolean;
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
  minDate?: string;
  maxDate?: string;
}

const DateWheelPickerModal: React.FC<DateWheelPickerModalProps> = ({
  isOpen,
  value,
  onChange,
  onClose,
  minDate,
  maxDate,
}) => {
  const [localDate, setLocalDate] = useState(value);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      setLocalDate(value);
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 200);
    }
  }, [isOpen]);

  const { year, month, day } = useMemo(() => {
    const [y, m, d] = localDate.split('-');
    return { year: y, month: m, day: d };
  }, [localDate]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = minDate
      ? new Date(minDate).getFullYear()
      : currentYear - 10;
    const endYear = maxDate
      ? new Date(maxDate).getFullYear()
      : currentYear + 10;

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, i) => String(startYear + i)
    );
  }, [minDate, maxDate]);

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        String(i + 1).padStart(2, '0')
      ),
    []
  );

  const daysInMonth = useMemo(
    () =>
      new Date(parseInt(year), parseInt(month), 0).getDate(),
    [year, month]
  );

  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth }, (_, i) =>
        String(i + 1).padStart(2, '0')
      ),
    [daysInMonth]
  );

  const monthNames = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec'
  ];

  if (!isVisible) return null;

  const handleChange = (
    type: 'year' | 'month' | 'day',
    newValue: string
  ) => {
    let newYear = parseInt(year);
    let newMonth = parseInt(month);
    let newDay = parseInt(day);

    if (type === 'year') newYear = parseInt(newValue);
    if (type === 'month') newMonth = parseInt(newValue);
    if (type === 'day') newDay = parseInt(newValue);

    const daysInNewMonth = new Date(
      newYear,
      newMonth,
      0
    ).getDate();

    if (newDay > daysInNewMonth) {
      newDay = daysInNewMonth;
    }

    const formatted = `${newYear}-${String(
      newMonth
    ).padStart(2, '0')}-${String(newDay).padStart(
      2,
      '0'
    )}`;

    setLocalDate(formatted);
  };

  const handleDone = () => {
    onChange(localDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <div
        className={`fixed inset-0 bg-black/40 ${
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
              Select Date
            </h3>
            <div className="w-8" />
          </div>

          <div className="flex items-center justify-center gap-3 mb-4 px-4">
            <WheelPicker
              value={month}
              onChange={(v) =>
                handleChange('month', v)
              }
              options={months}
              format={(v) =>
                monthNames[parseInt(v) - 1]
              }
            />

            <WheelPicker
              value={day}
              onChange={(v) =>
                handleChange('day', v)
              }
              options={days}
            />

            <WheelPicker
              value={year}
              onChange={(v) =>
                handleChange('year', v)
              }
              options={years}
            />
          </div>

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
};

export default DateWheelPickerModal;
