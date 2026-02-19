import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { format, addMonths, subMonths } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { useTheme } from '../../contexts/ThemeContext';

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
  const [currentMonth, setCurrentMonth] = useState<Date>(
    value ? new Date(value) : new Date()
  );
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
      setCurrentMonth(value ? new Date(value) : new Date());
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 200);
    }
  }, [isOpen, value]);

  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
      onClose();
    }
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
        onClick={onClose}
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
              onClick={onClose}
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

          <style>{`
            .rdp-root {
              --rdp-accent-color: ${isDarkMode ? '#B19CD9' : '#9C7BD3'};
              --rdp-accent-background-color: ${isDarkMode ? 'rgba(177, 156, 217, 0.3)' : 'rgba(156, 123, 211, 0.2)'};
              --rdp-selected-color: #ffffff;
              --rdp-selected-background-color: #B19CD9;
              --rdp-today-color: ${isDarkMode ? '#4ADEA8' : '#4ADEA8'};
              --rdp-today-background-color: ${isDarkMode ? 'rgba(74, 222, 168, 0.2)' : 'rgba(74, 222, 168, 0.15)'};
              --rdp-color: ${isDarkMode ? '#ffffff' : '#374151'};
              --rdp-background-color: transparent;
              --rdp-outline: none;
              --rdp-cell-size: 40px;
              --rdp-font-size: 14px;
              margin: 0;
              width: 100%;
            }
            .rdp-caption {
              display: none;
            }
            .rdp-nav {
              display: none;
            }
            .rdp-head_cell {
              color: ${isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} !important;
              font-weight: 500;
              font-size: 12px;
              text-transform: uppercase;
            }
            .rdp-day {
              color: ${isDarkMode ? '#ffffff' : '#374151'};
              border-radius: 8px;
            }
            .rdp-day:hover:not(.rdp-day_selected) {
              background-color: ${isDarkMode ? 'rgba(177, 156, 217, 0.2)' : 'rgba(156, 123, 211, 0.1)'};
            }
            .rdp-day_selected {
              background-color: #B19CD9 !important;
              color: #ffffff !important;
              font-weight: 600;
            }
            .rdp-day_selected:hover {
              background-color: #9C7BD3 !important;
            }
            .rdp-day_today:not(.rdp-day_selected) {
              border: 2px solid #4ADEA8;
              font-weight: 600;
            }
            .rdp-day_outside {
              color: ${isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)'} !important;
            }
            .rdp-month {
              width: 100%;
            }
          `}</style>

          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            month={currentMonth}
            fromDate={new Date(2000, 0, 1)}
            toDate={new Date(2100, 11, 31)}
            modifiers={{
              today: new Date(),
            }}
            modifiersStyles={{
              today: { 
                fontWeight: 'bold',
              }
            }}
          />

          <div className="flex gap-2 mt-4">
            <button
              onClick={onClose}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            {selectedDate && (
              <button
                onClick={() => {
                  onChange(format(selectedDate, 'yyyy-MM-dd'));
                  onClose();
                }}
                className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-medium hover:shadow-[0_0_15px_rgba(177,156,217,0.4)] transition-all"
              >
                Confirm
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default CalendarPickerModal;
