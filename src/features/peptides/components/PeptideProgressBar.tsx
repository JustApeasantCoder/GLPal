import React, { useMemo } from 'react';
import { Peptide, PeptideLogEntry, PeptideFrequency } from '../../../types';

interface PeptideProgressBarProps {
  peptide: Peptide;
  latestLog: PeptideLogEntry | null;
  currentTime: Date;
  color: string;
}

const getFrequencyDays = (frequency: PeptideFrequency): number => {
  switch (frequency) {
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
};

const getFrequencyLabel = (frequency: PeptideFrequency): string => {
  switch (frequency) {
    case 'daily': return 'daily';
    case 'twice_daily': return '2x daily';
    case 'every_other_day': return 'every other day';
    case 'three_times_week': return '3x / week';
    case 'twice_week': return '2x / week';
    case 'weekly': return 'weekly';
    case 'biweekly': return 'biweekly';
    case 'monthly': return 'monthly';
    case 'as_needed': return 'as needed';
    default: return 'weekly';
  }
};

const PeptideProgressBar: React.FC<PeptideProgressBarProps> = ({
  peptide,
  latestLog,
  currentTime,
  color,
}) => {
  const { progress, timeRemaining, isDue, isOverdue, daysSinceLastDose } = useMemo(() => {
    const intervalDays = getFrequencyDays(peptide.frequency);
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
    
    if (!latestLog) {
      return {
        progress: 100,
        timeRemaining: { days: 0, hours: 0, label: 'Never logged' },
        isDue: true,
        isOverdue: false,
        daysSinceLastDose: 0,
      };
    }

    const lastLogDate = new Date(latestLog.date + ' ' + latestLog.time);
    const timeSinceLastLog = currentTime.getTime() - lastLogDate.getTime();
    const daysSinceLastLog = timeSinceLastLog / (1000 * 60 * 60 * 24);
    
    const progressPercent = Math.min(100, (timeSinceLastLog / intervalMs) * 100);
    
    const timeUntilNext = intervalMs - timeSinceLastLog;
    const isOverdueFlag = timeUntilNext < 0;
    const isDueFlag = timeUntilNext <= 24 * 60 * 60 * 1000 && !isOverdueFlag;
    
    const remainingMs = Math.max(0, timeUntilNext);
    const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let label: string;
    if (isOverdueFlag) {
      const overdueDays = Math.abs(remainingDays);
      const overdueHours = Math.abs(remainingHours);
      label = overdueDays > 0 
        ? `Overdue by ${overdueDays}d ${overdueHours}h`
        : `Overdue by ${overdueHours}h`;
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
      daysSinceLastDose: daysSinceLastLog,
    };
  }, [peptide.frequency, latestLog, currentTime]);

  const progressColor = isOverdue 
    ? 'linear-gradient(90deg, #EF4444, #F87171, #EF4444)' 
    : `linear-gradient(90deg, ${color}, ${color}dd, ${color})`;

  const glowColor = isOverdue 
    ? 'rgba(239,68,68,0.7)' 
    : `${color}99`;

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="relative overflow-hidden h-8 rounded-lg bg-gradient-to-r from-[#0d0d1a] via-[#1a1a2e] to-[#0d0d1a] border border-[#B19CD9]/20">
        {/* Animated background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(177,156,217,0.1) 10px, rgba(177,156,217,0.1) 20px)',
          }}
        />
        
        {/* Progress Fill */}
        <div 
          className="absolute top-0 h-full transition-all duration-500"
          style={{ 
            width: `${Math.min(100, progress)}%`,
            background: progressColor,
            boxShadow: `0 0 20px ${glowColor}, inset 0 0 15px rgba(255,255,255,0.1)`,
          }}
        />
        
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-lg" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            {isOverdue 
              ? `Overdue - ${getFrequencyLabel(peptide.frequency)}` 
              : isDue 
                ? 'Due Now - Log Dose'
                : timeRemaining.label}
          </span>
        </div>
      </div>

      {/* Info Row */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>
          Last: {latestLog 
            ? `${latestLog.date} ${latestLog.time}` 
            : 'Never'}
        </span>
        <span className={isOverdue ? 'text-red-400' : isDue ? 'text-yellow-400' : ''}>
          {getFrequencyLabel(peptide.frequency)}
        </span>
      </div>
    </div>
  );
};

export default PeptideProgressBar;
