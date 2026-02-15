import React from 'react';
import { useTime } from '../../../shared/hooks';
import { DoseStats } from '../hooks/useDoseStats';

interface DoseProgressBarProps {
  stats: DoseStats;
  onLogDoseNow: () => void;
}

const DoseProgressBar: React.FC<DoseProgressBarProps> = ({ stats, onLogDoseNow }) => {
  const now = useTime(60000);
  
  if (stats.lastDoseDateStr === 'N/A') return null;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const lastDose = new Date(stats.lastDoseDateStr);
  lastDose.setFullYear(today.getFullYear());
  lastDose.setHours(0, 0, 0, 0);
  
  const isToday = today.getTime() === lastDose.getTime();
  const justLogged = isToday;
  const buttonVisible = !justLogged && stats.nextDueDays <= 0;

  // Calculate progress based on time remaining until next dose
  // Progress = 100% - (time remaining / interval) * 100
  // When time remaining = interval, progress = 0%
  // When time remaining = 0, progress = 100%
  const totalMilliseconds = stats.intervalDays * 24 * 60 * 60 * 1000;
  const timeRemainingMs = Math.max(0, stats.nextDueDays * 24 * 60 * 60 * 1000 + 
    stats.nextDueHours * 60 * 60 * 1000 + 
    stats.nextDueMinutes * 60 * 1000);
  
  // Invert: 100% when just logged (0 remaining), 0% when due
  const progressPercent = justLogged ? 100 : Math.min(100, Math.max(0, (1 - timeRemainingMs / totalMilliseconds) * 100));
  
  const greenThreshold = (6 / 7) * 100; // Show green in last 1/7 of the interval
  const isOverdue = stats.nextDueDays < 0 || (stats.nextDueDays === 0 && stats.nextDueHours < 0);

  const getStatusText = () => {
    if (justLogged) {
      return '✓ Dose Logged for Today';
    }
    if (stats.nextDueDays > 0) {
      return `${stats.nextDueDays} Day${stats.nextDueDays !== 1 ? 's' : ''} ${stats.nextDueHours} Hour${stats.nextDueHours !== 1 ? 's' : ''} Until Next Dose`;
    }
    if (stats.nextDueDays === 0 && stats.nextDueHours >= 0) {
      return `${stats.nextDueHours} Hour${stats.nextDueHours !== 1 ? 's' : ''} ${stats.nextDueMinutes} Minute${stats.nextDueMinutes !== 1 ? 's' : ''} Remaining`;
    }
    if (stats.nextDueDays < 0) {
      return `Overdue by ${Math.abs(stats.nextDueDays)} Day${Math.abs(stats.nextDueDays) !== 1 ? 's' : ''}`;
    }
    return `${Math.abs(stats.nextDueHours)} Hour${Math.abs(stats.nextDueHours) !== 1 ? 's' : ''} Overdue`;
  };

  const handleLogDose = () => {
    onLogDoseNow();
  };

  return (
    <div className="mb-4">
      <div className="relative overflow-hidden h-12 rounded-xl bg-gradient-to-r from-[#0d0d1a] via-[#1a1a2e] to-[#0d0d1a] border border-[#B19CD9]/40 shadow-[0_0_30px_rgba(177,156,217,0.2)]">
        {/* Animated stripes */}
        {!justLogged && (
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(177,156,217,0.15) 10px, rgba(177,156,217,0.15) 20px)',
              animation: 'stripeMove 2s linear infinite'
            }}
          />
        )}
        
        {/* Progress bar - all green when logged */}
        {justLogged ? (
          <div 
            className="absolute top-0 h-full w-full"
            style={{ 
              background: 'linear-gradient(90deg, #4ADEA8, #6EE7B7, #4ADEA8)',
              boxShadow: '0 0 25px rgba(74,222,168,0.7), inset 0 0 20px rgba(255,255,255,0.2)',
            }}
          />
        ) : progressPercent > 0 && (
          <div 
            className="absolute top-0 h-full"
            style={{ 
              left: 0,
              width: `${progressPercent}%`,
              background: isOverdue 
                ? 'linear-gradient(90deg, #EF4444, #F87171, #EF4444)'
                : 'linear-gradient(90deg, #B19CD9, #D4B8E8, #B19CD9)',
              boxShadow: isOverdue
                ? '0 0 25px rgba(239,68,68,0.7), inset 0 0 20px rgba(255,255,255,0.2)'
                : '0 0 25px rgba(177,156,217,0.6), inset 0 0 20px rgba(255,255,255,0.2)',
              transition: 'width 1s linear',
            }}
          />
        )}
        
        {!justLogged && !isOverdue && progressPercent > greenThreshold && (
          <div 
            className="absolute top-0 h-full"
            style={{ 
              left: `${greenThreshold}%`,
              width: `${progressPercent - greenThreshold}%`,
              background: 'linear-gradient(90deg, #4ADEA8, #6EE7B7, #4ADEA8)',
              boxShadow: '0 0 25px rgba(74,222,168,0.7), inset 0 0 20px rgba(255,255,255,0.2)',
              transition: 'width 1s linear, left 1s linear',
            }}
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {getStatusText()}
          </span>
        </div>
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-[#B19CD9]/70">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#4ADEA8]"></span>
          Last: {stats.lastDoseDateStr}
        </span>
        <span className="flex items-center gap-1">
          Next: {stats.nextDueDateStr}
          <span className="w-2 h-2 rounded-full bg-[#B19CD9]"></span>
        </span>
      </div>
      
      {stats.nextDueDays <= 0 && buttonVisible && !justLogged && (
        <button
          onClick={handleLogDose}
          className="mt-2 w-full py-2 px-4 rounded-lg bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white font-semibold text-sm shadow-[0_0_20px_rgba(74,222,168,0.5)] hover:shadow-[0_0_30px_rgba(74,222,168,0.7)] transition-all duration-300 hover:scale-[1.02]"
        >
          {stats.nextDueDays < 0 ? 'Log Overdue Dose' : 'Log Dose Now'}
        </button>
      )}
    </div>
  );
};

export default DoseProgressBar;
