import React, { useMemo } from 'react';
import { Peptide, PeptideLogEntry, PeptideFrequency } from '../../../types';
import { timeService } from '../../../core/timeService';

interface PeptideProgressBarProps {
  peptide: Peptide;
  latestLog: PeptideLogEntry | null;
  currentTime: Date;
  color: string;
}

// Parse date and time as local time (avoids UTC issues)
const parseLocalDateTime = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

const getFrequencyDays = (frequency: PeptideFrequency): number => {
  switch (frequency) {
    case 'daily': return 1;
    case 'every_other_day': return 2;
    case 'every_3_days': return 3;
    case 'every_35_days': return 3.5;
    case 'every_4_days': return 4;
    case 'every_5_days': return 5;
    case 'every_6_days': return 6;
    case 'weekly': return 7;
    case 'twice_week': return 3.5;
    case 'biweekly': return 14;
    case 'triweekly': return 21;
    case 'monthly': return 30;
    case 'as_needed': return 7;
    default: return 7;
  }
};

// Get due window in hours (±8 from preferred time)
const getDueWindowHours = (): number => 8;

const getFrequencyLabel = (frequency: PeptideFrequency): string => {
  switch (frequency) {
    case 'daily': return 'Everyday';
    case 'every_other_day': return 'Every 2 Days';
    case 'every_3_days': return 'Every 3 Days';
    case 'every_35_days': return 'Every 3.5 Days';
    case 'every_4_days': return 'Every 4 Days';
    case 'every_5_days': return 'Every 5 Days';
    case 'every_6_days': return 'Every 6 Days';
    case 'weekly': return 'Every Week';
    case 'twice_week': return '2x / Week';
    case 'biweekly': return 'Every 2 Weeks';
    case 'triweekly': return 'Every 3 Weeks';
    case 'monthly': return 'Every Month';
    case 'as_needed': return 'As Needed';
    default: return 'Every Week';
  }
};

const PeptideProgressBar: React.FC<PeptideProgressBarProps> = ({
  peptide,
  latestLog,
  currentTime,
  color,
}) => {
  const result = useMemo(() => {
    const intervalDays = getFrequencyDays(peptide.frequency);
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
    const dueWindowMs = getDueWindowHours() * 60 * 60 * 1000;
    const isDaily = peptide.frequency === 'daily';
    
    // Parse preferred time (only used for daily)
    const preferredParts = (peptide.preferredTime || '08:00').split(':');
    const preferredHours = parseInt(preferredParts[0], 10);
    const preferredMinutes = parseInt(preferredParts[1], 10);
    
    if (!latestLog) {
      return {
        progress: 100,
        timeRemaining: { days: 0, hours: 0, label: 'Never logged' },
        isDue: true,
        isOverdue: false,
        isLoggedToday: false,
        isDaily,
        daysSinceLastDose: 0,
      };
    }

    const lastLogDate = parseLocalDateTime(latestLog.date, latestLog.time);
    const timeSinceLastLog = currentTime.getTime() - lastLogDate.getTime();
    const daysSinceLastLog = timeSinceLastLog / (1000 * 60 * 60 * 24);
    
    // Progress calculation
    let progressPercent: number;
    let timeUntilNext: number;
    
    if (isDaily) {
      // Daily: progress reaches 100% at preferred time
      const currentHours = currentTime.getHours();
      const currentMinutes = currentTime.getMinutes();
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;
      const preferredTimeInMinutes = preferredHours * 60 + preferredMinutes;
      
      let preferredTarget = new Date(currentTime);
      preferredTarget.setHours(preferredHours, preferredMinutes, 0, 0);
      
      if (currentTimeInMinutes < preferredTimeInMinutes) {
        // Before preferred time today
      } else {
        preferredTarget.setDate(preferredTarget.getDate() + 1);
      }
      
      const timeFromLastLogToTarget = preferredTarget.getTime() - lastLogDate.getTime();
      if (timeFromLastLogToTarget > 0) {
        progressPercent = Math.min(100, (timeSinceLastLog / timeFromLastLogToTarget) * 100);
      } else {
        progressPercent = 100;
      }
      timeUntilNext = preferredTarget.getTime() - currentTime.getTime();
    } else {
      // Non-daily: countdown starts at next midnight after log
      const lastLogMidnight = new Date(lastLogDate);
      lastLogMidnight.setDate(lastLogMidnight.getDate() + 1);
      lastLogMidnight.setHours(0, 0, 0, 0);
      
      const timeSinceMidnight = currentTime.getTime() - lastLogMidnight.getTime();
      
      if (timeSinceMidnight <= 0) {
        // Before midnight - full countdown
        progressPercent = 0;
        timeUntilNext = -timeSinceMidnight;
      } else {
        // After midnight - progress based on interval from midnight
        progressPercent = Math.min(100, (timeSinceMidnight / intervalMs) * 100);
        timeUntilNext = Math.max(0, intervalMs - timeSinceMidnight);
      }
    }
    
    // Due window (only for daily)
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    const preferredTimeInMinutes = preferredHours * 60 + preferredMinutes;
    const dueWindowStartMinutes = preferredTimeInMinutes - dueWindowMs / (60 * 1000);
    const dueWindowEndMinutes = preferredTimeInMinutes + dueWindowMs / (60 * 1000);
    const isWithinDueWindow = currentTimeInMinutes >= dueWindowStartMinutes && currentTimeInMinutes <= dueWindowEndMinutes;
    
    // Check if logged today
    const todayStr = timeService.toLocalDateString(currentTime);
    const isLoggedToday = latestLog && latestLog.date === todayStr;
    
    // Overdue and Due flags
    let isOverdueFlag: boolean;
    let isDueFlag: boolean;
    
    if (isDaily) {
      // Daily: based on preferred time
      isOverdueFlag = currentTimeInMinutes > preferredTimeInMinutes && !isLoggedToday;
      isDueFlag = isWithinDueWindow;
    } else {
      // Non-daily: based on midnight after last log
      const lastLogMidnight = new Date(lastLogDate);
      lastLogMidnight.setDate(lastLogMidnight.getDate() + 1);
      lastLogMidnight.setHours(0, 0, 0, 0);
      
      const timeSinceMidnight = currentTime.getTime() - lastLogMidnight.getTime();
      const daysSinceMidnight = timeSinceMidnight / (1000 * 60 * 60 * 24);
      
      isOverdueFlag = daysSinceMidnight >= intervalDays;
      
      // For non-daily: isDue when it's exactly at the due date
      // isDue shows when today is the scheduled dose day
      const todayMidnight = new Date(currentTime);
      todayMidnight.setHours(0, 0, 0, 0);
      const lastLogMidnight2 = new Date(lastLogDate);
      lastLogMidnight2.setHours(0, 0, 0, 0);
      const nextDueMidnight = new Date(lastLogMidnight2);
      nextDueMidnight.setDate(nextDueMidnight.getDate() + intervalDays);
      const isDueDay = todayMidnight.getTime() === nextDueMidnight.getTime();
      isDueFlag = isDueDay;
    }
    
    // Calculate overdue display for daily
    let overdueHours = 0;
    let overdueMinutes = 0;
    if (isOverdueFlag && isDaily) {
      let todaysPreferred = new Date(currentTime);
      todaysPreferred.setHours(preferredHours, preferredMinutes, 0, 0);
      const overdueMs = currentTime.getTime() - todaysPreferred.getTime();
      overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
      overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
    }

    const remainingMs = Math.max(0, timeUntilNext);
    const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let label: string;
    // Show "Dose Logged For Today" if logged today
    if (isLoggedToday) {
      label = 'Dose Logged For Today';
    } else if (isOverdueFlag) {
      if (isDaily) {
        // Show overdue in hours/minutes for daily
        label = overdueHours > 0 
          ? `Overdue by ${overdueHours}h ${overdueMinutes}m`
          : `Overdue by ${overdueMinutes}m`;
      } else {
        const overdueDays = Math.abs(remainingDays);
        const overdueHoursAbs = Math.abs(remainingHours);
        label = overdueDays > 0 
          ? `Overdue by ${overdueDays}d ${overdueHoursAbs}h`
          : `Overdue by ${overdueHoursAbs}h`;
      }
    } else if (isDaily) {
      // For daily, always show countdown to preferred time (not "Due now")
      if (remainingDays > 0) {
        label = `${remainingDays}d ${remainingHours}h until next`;
      } else if (remainingHours > 0) {
        label = `${remainingHours}h ${remainingMinutes}m until next`;
      } else {
        label = `${remainingMinutes}m until next`;
      }
    } else if (remainingDays > 0) {
      label = `${remainingDays}d ${remainingHours}h until next`;
    } else if (remainingHours > 0) {
      label = `${remainingHours}h ${remainingMinutes}m until next`;
    } else {
      label = 'Due now';
    }

    return {
      progress: progressPercent,
      timeRemaining: { 
        days: remainingDays, 
        hours: remainingHours, 
        label 
      },
      isDue: isDueFlag,
      isOverdue: isOverdueFlag,
      isLoggedToday,
      isDaily,
      daysSinceLastDose: daysSinceLastLog,
      // Debug info
      debug: {
        currentTimeInMinutes,
        preferredTimeInMinutes,
        dueWindowStartMinutes,
        dueWindowEndMinutes,
        isWithinDueWindow,
        timeUntilNext,
        intervalMs,
      },
    };
  }, [peptide.frequency, peptide.preferredTime, latestLog, currentTime]);

  const { progress, timeRemaining, isDue, isOverdue, isLoggedToday, isDaily, daysSinceLastDose, debug = {} as any } = result;

  const peptidePurple = '#B19CD9';
  // For daily overdue, keep purple color
  const progressColor = isOverdue && !isDaily
    ? 'linear-gradient(90deg, #EF4444, #F87171, #EF4444)' 
    : `linear-gradient(90deg, ${peptidePurple}, ${peptidePurple}dd, ${peptidePurple})`;

  const glowColor = isOverdue && !isDaily
    ? 'rgba(239,68,68,0.7)' 
    : 'rgba(177,156,217,0.6)';

  // For daily, override overdue to show "Dose Due Today" and keep bar full
  const isOverdueDaily = isOverdue && isDaily;
  const displayProgress = isOverdueDaily ? 100 : progress;
  const displayLabel = isOverdueDaily 
    ? 'Dose Due Today - Log Now' 
    : isOverdue 
      ? `Overdue - ${getFrequencyLabel(peptide.frequency)}` 
      : isDaily || !isDue 
        ? timeRemaining.label
        : 'Due Now - Log Dose';

  return (
    <div className="mb-4">
      {/* Progress Bar */}
      <div className="relative overflow-hidden h-12 rounded-xl bg-gradient-to-r from-[#0d0d1a] via-[#1a1a2e] to-[#0d0d1a] border border-[#B19CD9]/40 shadow-[0_0_15px_rgba(177,156,217,0.2)]">
        {/* Animated background */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(177,156,217,0.1) 10px, rgba(177,156,217,0.1) 20px)',
            animation: 'stripeMove 2s linear infinite'
          }}
        />
        
        {/* Progress Fill */}
        <div 
          className="absolute top-0 h-full transition-all duration-300"
          style={{ 
            width: `${Math.min(100, displayProgress)}%`,
            background: progressColor,
            boxShadow: `0 0 25px ${glowColor}, inset 0 0 20px rgba(255,255,255,0.2)`,
          }}
        />
        
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {displayLabel}
          </span>
        </div>
      </div>

      {/* Info Row */}
      <div className="flex justify-between mt-2 text-xs text-[#B19CD9]/70">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#4ADEA8]"></span>
          Last: {latestLog 
            ? `${latestLog.date} ${latestLog.time}` 
            : 'Never'}
        </span>
        <span className="font-medium text-[#B19CD9]">{peptide.name}</span>
        <span className="flex items-center gap-1">
          {getFrequencyLabel(peptide.frequency)}
          <span className="w-2 h-2 rounded-full bg-[#B19CD9]"></span>
        </span>
      </div>

      {/* Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
      <div className="mt-2 p-2 bg-black/50 rounded text-xs font-mono text-gray-400">
        <div className="grid grid-cols-2 gap-1">
          <div>currentTimeInMinutes: {debug.currentTimeInMinutes}</div>
          <div>preferredTimeInMinutes: {debug.preferredTimeInMinutes}</div>
          <div>dueWindowStart: {debug.dueWindowStartMinutes}</div>
          <div>dueWindowEnd: {debug.dueWindowEndMinutes}</div>
          <div>isWithinDueWindow: <span className={debug.isWithinDueWindow ? 'text-green-400' : 'text-red-400'}>{String(debug.isWithinDueWindow)}</span></div>
          <div>timeUntilNext: {Math.round(debug.timeUntilNext / 60000)}min</div>
          <div>intervalMs: {Math.round(debug.intervalMs / 3600000)}h</div>
          <div>isDue: <span className={isDue ? 'text-green-400' : 'text-red-400'}>{String(isDue)}</span></div>
          <div>isOverdue: <span className={isOverdue ? 'text-green-400' : 'text-red-400'}>{String(isOverdue)}</span></div>
          <div>isDaily: {String(isDaily)}</div>
          <div>isLoggedToday: {String(isLoggedToday)}</div>
        </div>
      </div>
      )}
    </div>
  );
};

export default PeptideProgressBar;
