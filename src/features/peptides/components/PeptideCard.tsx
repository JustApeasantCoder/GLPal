import React from 'react';
import { Peptide, PeptideLogEntry, PeptideCategory } from '../../../types';
import PeptideProgressBar from './PeptideProgressBar';
import { useTheme } from '../../../contexts/ThemeContext';
import { timeService } from '../../../core/timeService';

interface PeptideCardProps {
  peptide: Peptide;
  latestLog: PeptideLogEntry | null;
  currentTime: Date;
  onLog: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
}

// Parse date and time as local time (avoids UTC issues)
const parseLocalDateTime = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

const CATEGORY_LABELS: Record<PeptideCategory, string> = {
  healing: 'Healing',
  growth_hormone: 'GH',
  fat_loss: 'Fat Loss',
  muscle: 'Muscle',
  longevity: 'Longevity',
  immune: 'Immune',
  skin: 'Skin',
  cognitive: 'Cognitive',
  other: 'Other',
};

const ROUTE_ICONS: Record<string, string> = {
  subcutaneous: 'SQ',
  intramuscular: 'IM',
  intravenous: 'IV',
  oral: 'Oral',
  topical: 'Topical',
  intranasal: 'IN',
  sublingual: 'Sub',
};

const PeptideCard: React.FC<PeptideCardProps> = ({
  peptide,
  latestLog,
  currentTime,
  onLog,
  onEdit,
  onToggleActive,
}) => {
  const { isDarkMode } = useTheme();
  
  if (!peptide.isActive && peptide.isArchived) {
    return null;
  }

  // Get due window in hours (±8 from preferred time)
  const getDueWindowHours = (): number => 8;

  // Determine if the Log button should be shown based on due/overdue state.
  const frequencyDays = (() => {
    switch (peptide.frequency) {
      case 'daily': return 1;
      case 'every_other_day': return 2;
      case 'every_3_days': return 3;
      case 'every_35_days': return 3.5;
      case 'every_4_days': return 4;
      case 'every_5_days': return 5;
      case 'every_6_days': return 6;
      case 'weekly': return 7;
      case 'weekday': return 1;
      case 'weekend': return 1;
      case 'biweekly': return 14;
      case 'triweekly': return 21;
      case 'monthly': return 30;
      case 'as_needed': return 7;
      default: return 7;
    }
  })();
  const intervalMs = frequencyDays * 24 * 60 * 60 * 1000;
  
  const isDaily = peptide.frequency === 'daily' || peptide.frequency === 'weekday' || peptide.frequency === 'weekend';
  const isWeekdayFreq = peptide.frequency === 'weekday';
  const isWeekendFreq = peptide.frequency === 'weekend';
  const isWeekday = (date: Date): boolean => {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  };
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };
  const isValidDayToday = (isWeekdayFreq && isWeekday(currentTime)) || (isWeekendFreq && isWeekend(currentTime)) || !isWeekdayFreq && !isWeekendFreq;
  const isWeekdayOrWeekend = isWeekdayFreq || isWeekendFreq;
  const notScheduledToday = isWeekdayOrWeekend && !isValidDayToday;
  
  const todayStr = timeService.toLocalDateString(currentTime);
  const isLoggedToday = latestLog && latestLog.date === todayStr;
  
  let isDue = false;
  let isOverdue = false;
  
  if (!latestLog) {
    isDue = true;
  } else if (isDaily) {
    // Daily: based on preferred time
    const lastLogDate = parseLocalDateTime(latestLog.date, latestLog.time);
    const timeSinceLast = currentTime.getTime() - lastLogDate.getTime();
    const dueWindowMs = getDueWindowHours() * 60 * 60 * 1000;
    
    const preferredParts = (peptide.preferredTime || '08:00').split(':');
    const preferredHours = parseInt(preferredParts[0], 10);
    const preferredMinutes = parseInt(preferredParts[1], 10);
    
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    const preferredTimeInMinutes = preferredHours * 60 + preferredMinutes;
    
    const dueWindowStartMinutes = preferredTimeInMinutes - dueWindowMs / (60 * 1000);
    const dueWindowEndMinutes = preferredTimeInMinutes + dueWindowMs / (60 * 1000);
    
    const isWithinDueWindow = currentTimeInMinutes >= dueWindowStartMinutes && currentTimeInMinutes <= dueWindowEndMinutes;
    
    isOverdue = currentTimeInMinutes > preferredTimeInMinutes && !isLoggedToday && isValidDayToday;
    isDue = isWithinDueWindow && isValidDayToday;
  } else {
    // Non-daily: countdown starts at next midnight after log
    const lastLogDate = parseLocalDateTime(latestLog.date, latestLog.time);
    const lastLogMidnight2 = new Date(lastLogDate);
    lastLogMidnight2.setDate(lastLogMidnight2.getDate() + 1);
    lastLogMidnight2.setHours(0, 0, 0, 0);
    
    const timeSinceMidnight = currentTime.getTime() - lastLogMidnight2.getTime();
    const daysSinceMidnight = timeSinceMidnight / (1000 * 60 * 60 * 24);
    
    isOverdue = daysSinceMidnight >= frequencyDays;
    // For non-daily: isDue when today is the scheduled dose day
    const todayMidnight = new Date(currentTime);
    todayMidnight.setHours(0, 0, 0, 0);
    const lastLogMidnight = new Date(lastLogDate);
    lastLogMidnight.setHours(0, 0, 0, 0);
    const nextDueMidnight = new Date(lastLogMidnight);
    nextDueMidnight.setDate(nextDueMidnight.getDate() + frequencyDays);
    const isDueDay = todayMidnight.getTime() === nextDueMidnight.getTime();
    isDue = isDueDay;
  }
  // For daily, show button only when not logged today; for others, show when due or overdue
  const showLogButton = peptide.isActive && !notScheduledToday && (isDaily ? !isLoggedToday : (isDue || isOverdue));
  // Show "Dose Logged For Today" if logged today
  const logButtonText = isLoggedToday 
    ? 'Dose Logged For Today' 
    : (isOverdue && !isDaily)
      ? 'Log Overdue Dose' 
      : 'Log Dose Now';

  return (
    <div 
      onClick={onEdit}
      className={`rounded-2xl p-4 border transition-all duration-300 cursor-pointer ${
        peptide.isActive 
          ? isDarkMode
            ? 'bg-black/20 border-[#B19CD9]/20 hover:border-[#B19CD9]/40'
            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
          : isDarkMode
            ? 'bg-black/20 border-gray-700/50 opacity-60'
            : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
      style={{ borderLeftWidth: '3px', borderLeftColor: peptide.color }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{peptide.name}</h3>
          <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <span>{peptide.dose}{peptide.doseUnit}</span>
            <span>{ROUTE_ICONS[peptide.route]}</span>
            <span 
              className="px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${peptide.color}20`, color: peptide.color }}
            >
              {CATEGORY_LABELS[peptide.category]}
            </span>
          </div>
        </div>
        
        {/* Toggle Active */}
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive();
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              peptide.isActive 
                ? 'text-green-400 hover:bg-green-400/20' 
                : isDarkMode
                  ? 'text-gray-500 hover:bg-gray-500/20'
                  : 'text-gray-400 hover:bg-gray-200'
            }`}
            title={peptide.isActive ? 'Active' : 'Inactive'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {peptide.isActive ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <PeptideProgressBar 
          peptide={peptide}
          latestLog={latestLog}
          currentTime={currentTime}
          color={peptide.color}
        />
      </div>

      {/* Log Button: shown when due or overdue (copying MedicationTab styling) */}
      {showLogButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLog();
          }}
          className={`mt-2 w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
            (isOverdue && !isDaily)
              ? 'bg-gradient-to-r from-[#EF4444] to-[#F87171] text-white hover:scale-[1.02] animate-pulse'
              : 'bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white hover:scale-[1.02]'
          }`}
          style={{
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
            boxShadow: (isOverdue && !isDaily)
              ? '0 0 20px rgba(239,68,68,0.8), 0 0 40px rgba(239,68,68,0.4)'
              : '0 0 10px rgba(74,222,168,0.5), 0 0 20px rgba(74,222,168,0.3)',
          }}
        >
          {logButtonText}
        </button>
      )}

      {/* Notes Preview */}
      {peptide.notes && (
        <p className={`mt-2 text-xs line-clamp-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{peptide.notes}</p>
      )}
    </div>
  );
};

export default PeptideCard;
