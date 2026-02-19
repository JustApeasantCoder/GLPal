import React, { useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';

interface DatePickerProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  month: Date;
  isDarkMode?: boolean;
  // Called when user clicks the "Today" button. Receives the date representing "today".
  onTodayClick?: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selected,
  onSelect,
  month,
  isDarkMode = false,
  onTodayClick,
}) => {
  // Show 13-month window: 6 months past, current month, 6 months future
  const months = Array.from({ length: 13 }, (_, idx) => addMonths(month, idx - 6));
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  
  useEffect(() => {
    if (scrollRef.current && isFirstRender.current) {
      const container = scrollRef.current;
      const middleIndex = 6;
      setTimeout(() => {
        const middleMonthEl = container.children[middleIndex] as HTMLElement;
        if (middleMonthEl) {
          middleMonthEl.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
        isFirstRender.current = false;
      }, 100);
    }
  }, []);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const textColor = isDarkMode ? '#ffffff' : '#374151';
  const outsideColor = isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)';
  const weekdayColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const accentColor = isDarkMode ? '#B19CD9' : '#9C7BD3';
  const todayColor = '#4ADEA8';

  const handleDayClick = (day: Date) => {
    onSelect(day);
  };

  const getMonthDays = (monthDate: Date) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    return eachDayOfInterval({ start, end });
  };

  const renderMonth = (monthDate: Date, index: number) => {
    const days = getMonthDays(monthDate);
    const startDayOfWeek = getDay(startOfMonth(monthDate));
    const monthLabel = format(monthDate, 'MMMM yyyy');

    return (
      <div key={monthDate.toISOString()} className="mb-4 last:mb-0">
        <div
          className="text-center text-sm font-semibold mb-2"
          style={{ color: weekdayColor }}
        >
          {monthLabel}
        </div>
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium uppercase"
              style={{ color: weekdayColor }}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map((day) => {
            const isSelected = selected && isSameDay(day, selected);
            const isCurrentDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, month);

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDayClick(day)}
                className="aspect-square rounded-lg flex items-center justify-center text-sm transition-all"
                style={{
                  color: !isCurrentMonth
                    ? outsideColor
                    : isSelected
                    ? '#ffffff'
                    : textColor,
                  backgroundColor: isSelected
                    ? accentColor
                    : 'transparent',
                  fontWeight: isCurrentDay && !isSelected ? '600' : '400',
                  border: isCurrentDay && !isSelected ? `2px solid ${todayColor}` : 'none',
                }}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {onTodayClick && (
        <div className="flex justify-center mb-3">
          <button
            type="button"
            onClick={() => onTodayClick ? onTodayClick(new Date()) : undefined}
            className="text-xs font-medium px-3 py-1 rounded-full transition-colors"
            style={{
              backgroundColor: isDarkMode ? 'rgba(74, 222, 168, 0.2)' : 'rgba(74, 222, 168, 0.15)',
              color: todayColor,
            }}
          >
            Today
          </button>
        </div>
      )}
      <div ref={scrollRef} className="overflow-y-auto max-h-[500px] pr-1">
        {months.map((monthDate, index) => renderMonth(monthDate, index))}
      </div>
    </div>
  );
};

export default DatePicker;
