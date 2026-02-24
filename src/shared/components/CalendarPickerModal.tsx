import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { format, addMonths, subMonths } from 'date-fns';
import { useTheme } from '../../contexts/ThemeContext';
import DatePicker from './DatePicker';

interface CalendarPickerModalProps {
  isOpen: boolean;
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
}

const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({
  isOpen,
  value,
  onChange,
  onClose,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const getInitialMonth = () => {
    if (value) {
      const parsed = new Date(value);
      return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  };
  const [currentMonth, setCurrentMonth] = useState<Date>(getInitialMonth());
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      setSelectedDate(value ? new Date(value) : undefined);
      setCurrentMonth(getInitialMonth());
    }
  }, [isOpen, value]);

  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
      handleClose();
    }
  };

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
    }, 200);
    return () => clearTimeout(timer);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    setCurrentMonth(new Date(currentMonth.getFullYear(), newMonth, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setCurrentMonth(new Date(newYear, currentMonth.getMonth(), 1));
  };

  if (!isVisible) return null;

  const modal = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/60 ${
          isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'
        }`}
        style={{ backdropFilter: 'blur(8px)' }}
        onClick={handleClose}
      />

      <div className="relative w-full max-w-sm">
        <div
          className={`relative isolate rounded-2xl border shadow-2xl p-4 max-h-[90vh] overflow-y-auto transition-all ${
            isDarkMode 
              ? 'border-[#B19CD9]/30 bg-gradient-to-b from-[#1a1625]/95 to-[#0d0a15]/95'
              : 'border-gray-200 bg-white'
          } ${
            isClosing
              ? 'modal-fade-out'
              : 'modal-content-fade-in'
          }`}
          style={isDarkMode ? {
            boxShadow: '0 0 30px rgba(177, 156, 217, 0.3)',
          } : {}}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Select Date
            </h3>
            <button
              onClick={handleClose}
              className={`p-1 rounded-lg transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'text-[#B19CD9] hover:bg-[#B19CD9]/20' : 'text-[#9C7BD3] hover:bg-[#9C7BD3]/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2">
              <select
                value={currentMonth.getMonth()}
                onChange={handleMonthChange}
                className={`text-sm font-semibold bg-transparent border-none cursor-pointer focus:outline-none ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {months.map((month, index) => (
                  <option key={month} value={index} className={isDarkMode ? 'bg-[#1a1625]' : 'bg-white'}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={currentMonth.getFullYear()}
                onChange={handleYearChange}
                className={`text-sm font-semibold bg-transparent border-none cursor-pointer focus:outline-none ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {years.map((year) => (
                  <option key={year} value={year} className={isDarkMode ? 'bg-[#1a1625]' : 'bg-white'}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'text-[#B19CD9] hover:bg-[#B19CD9]/20' : 'text-[#9C7BD3] hover:bg-[#9C7BD3]/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <DatePicker
            key={currentMonth.toISOString()}
            selected={selectedDate}
            onSelect={handleSelect}
            month={currentMonth}
            isDarkMode={isDarkMode}
            onTodayClick={(date) => {
              // Jump to today and reflect selection in the picker view
              // Use the first day of the month to ensure the view centers on the correct month
              const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
              setCurrentMonth(firstOfMonth);
              setSelectedDate(date);
            }}
          />

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleClose}
              className={`flex-1 py-3 rounded-xl border transition-all font-medium ${
                isDarkMode
                  ? 'border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedDate) {
                  onChange(format(selectedDate, 'yyyy-MM-dd'));
                  handleClose();
                }
              }}
              disabled={!selectedDate}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                selectedDate
                  ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white hover:shadow-[0_0_20px_rgba(177,156,217,0.5)]'
                  : isDarkMode
                    ? 'bg-[#B19CD9]/30 text-white/50 cursor-not-allowed'
                    : 'bg-[#B19CD9]/30 text-gray-400 cursor-not-allowed'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default CalendarPickerModal;
