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
  onDelete: () => void;
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
  onDelete,
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
      case 'twice_daily': return 0.5;
      case 'every_other_day': return 2;
      case 'three_times_week': return 7 / 3;
      case 'twice_week': return 7 / 2;
      case 'weekly': return 7;
      case 'biweekly': return 14;
      case 'monthly': return 30;
      case 'as_needed': return 7;
      default: return 7;
    }
  })();
  const intervalMs = frequencyDays * 24 * 60 * 60 * 1000;
  
  const isDaily = peptide.frequency === 'daily';
  const todayStr = timeService.toLocalDateString(currentTime);
  const isLoggedToday = latestLog && latestLog.date === todayStr;
  
  let isDue = false;
  let isOverdue = false;
  if (!latestLog) {
    isDue = true;
  } else {
    const lastLogDate = parseLocalDateTime(latestLog.date, latestLog.time);
    const timeSinceLast = currentTime.getTime() - lastLogDate.getTime();
    const timeUntilNext = intervalMs - timeSinceLast;
    const dueWindowMs = getDueWindowHours() * 60 * 60 * 1000;
    
    // Parse preferred time
    const preferredParts = (peptide.preferredTime || '08:00').split(':');
    const preferredHours = parseInt(preferredParts[0], 10);
    const preferredMinutes = parseInt(preferredParts[1], 10);
    
    // Check if we're within the due window around preferred time
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    const preferredTimeInMinutes = preferredHours * 60 + preferredMinutes;
    
    const dueWindowStartMinutes = preferredTimeInMinutes - dueWindowMs / (60 * 1000);
    const dueWindowEndMinutes = preferredTimeInMinutes + dueWindowMs / (60 * 1000);
    
    const isWithinDueWindow = currentTimeInMinutes >= dueWindowStartMinutes && currentTimeInMinutes <= dueWindowEndMinutes;
    
    // Overdue: for daily, past preferred time and no log today; for non-daily, past due window and past interval
    isOverdue = isDaily 
      ? (currentTimeInMinutes > preferredTimeInMinutes && !isLoggedToday)
      : (currentTimeInMinutes > dueWindowEndMinutes && timeSinceLast >= intervalMs);
    // Due: within the due window around preferred time
    isDue = isWithinDueWindow;
  }
  // For daily, always show button; otherwise only show when due or overdue
  const showLogButton = peptide.isActive && (isDaily || isDue || isOverdue);
  // For daily, don't show "Log Overdue Dose" - keep "Log Dose Now"
  const logButtonText = isLoggedToday 
    ? 'Dose Logged For Today' 
    : (isOverdue && !isDaily)
      ? 'Log Overdue Dose' 
      : 'Log Dose Now';

  return (
    <div 
      className={`rounded-2xl p-4 border transition-all duration-300 ${
        peptide.isActive 
          ? isDarkMode
            ? 'bg-black/30 border-[#B19CD9]/20 hover:border-[#B19CD9]/40'
            : 'bg-white border-gray-200 hover:border-gray-300'
          : isDarkMode
            ? 'bg-black/20 border-gray-700/50 opacity-60'
            : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: peptide.color }}
          />
          <div>
            <h3 className="font-semibold text-white">{peptide.name}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span 
                className="px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${peptide.color}20`, color: peptide.color }}
              >
                {CATEGORY_LABELS[peptide.category]}
              </span>
              <span>{peptide.dose}{peptide.doseUnit}</span>
              <span>{ROUTE_ICONS[peptide.route]}</span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-1">
          <button
            onClick={onToggleActive}
            className={`p-1.5 rounded-lg transition-colors ${
              peptide.isActive 
                ? 'text-green-400 hover:bg-green-400/20' 
                : 'text-gray-500 hover:bg-gray-500/20'
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
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-400/20 hover:text-red-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
          onClick={onLog}
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
        <p className="mt-2 text-xs text-gray-500 line-clamp-2">{peptide.notes}</p>
      )}
    </div>
  );
};

export default PeptideCard;
