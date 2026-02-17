import React, { useMemo } from 'react';
import { MedicationStats } from '../hooks/useMedicationStats';
import { GLP1Protocol } from '../../../types';

interface MedicationProgressBarProps {
  stats: MedicationStats;
  doseLoggedToday: boolean;
  currentTime: Date;
  onLogDose: () => void;
  isLogging: boolean;
  medicationName: string;
  medicationColor?: { stroke: string; fill: string };
  activeProtocol?: GLP1Protocol;
}

const MedicationProgressBar: React.FC<MedicationProgressBarProps> = ({
  stats,
  doseLoggedToday,
  currentTime,
  onLogDose,
  isLogging,
  medicationName,
  medicationColor,
  activeProtocol,
}) => {
  const { 
    lastDoseDateStr, 
    isScheduleStartDay, 
    isDueToday, 
    isOverdue,
    nextDueDays, 
    nextDueHours,
    nextDueDateStr,
    daysSinceLastDose,
    actualDaysSinceLastDose,
    intervalDays,
    semaglutideIsOverdue,
    tirzepatideIsOverdue,
    retatrutideIsOverdue,
    cagrilintideIsOverdue,
    semaglutideEntryToday,
    tirzepatideEntryToday,
    retatrutideEntryToday,
    cagrilintideEntryToday,
    semaglutideDaysSinceLastDose,
    tirzepatideDaysSinceLastDose,
    retatrutideDaysSinceLastDose,
    cagrilintideDaysSinceLastDose,
  } = stats;

  const medicationIsOverdue = 
    medicationName.toLowerCase().includes('semaglutide') ? semaglutideIsOverdue :
    medicationName.toLowerCase().includes('tirzepatide') ? tirzepatideIsOverdue :
    medicationName.toLowerCase().includes('retatrutide') ? retatrutideIsOverdue :
    medicationName.toLowerCase().includes('cagrilintide') ? cagrilintideIsOverdue :
    isOverdue;

  const medicationEntryToday = 
    medicationName.toLowerCase().includes('semaglutide') ? semaglutideEntryToday :
    medicationName.toLowerCase().includes('tirzepatide') ? tirzepatideEntryToday :
    medicationName.toLowerCase().includes('retatrutide') ? retatrutideEntryToday :
    medicationName.toLowerCase().includes('cagrilintide') ? cagrilintideEntryToday :
    doseLoggedToday;

  const medicationDaysSinceLastDose = 
    medicationName.toLowerCase().includes('semaglutide') ? semaglutideDaysSinceLastDose :
    medicationName.toLowerCase().includes('tirzepatide') ? tirzepatideDaysSinceLastDose :
    medicationName.toLowerCase().includes('retatrutide') ? retatrutideDaysSinceLastDose :
    medicationName.toLowerCase().includes('cagrilintide') ? cagrilintideDaysSinceLastDose :
    actualDaysSinceLastDose;

  const shouldShowProgress = lastDoseDateStr !== 'N/A' || stats.isScheduleStartDay;

  const getProgressBarContent = () => {
    const rawProgress = lastDoseDateStr === 'N/A' && !isScheduleStartDay
      ? 0 
      : lastDoseDateStr === 'N/A' && isScheduleStartDay
        ? 0
        : Math.min(80, Math.max(0, (daysSinceLastDose / intervalDays) * 100));
    const progressPercent = medicationEntryToday ? 100 : rawProgress;

    return (
      <>
        {progressPercent > 0 && !isDueToday && !medicationEntryToday && (
          <div 
            className="absolute top-0 h-full transition-all duration-300"
            style={{ 
              left: 0,
              width: `${progressPercent}%`,
              background: medicationIsOverdue
                ? 'linear-gradient(90deg, #EF4444, #F87171, #EF4444)'
                : 'linear-gradient(90deg, #9579be, #cdbcec, #9579be)',
              boxShadow: medicationIsOverdue
                ? '0 0 25px rgba(239,68,68,0.7), inset 0 0 20px rgba(255,255,255,0.2)'
                : '0 0 25px rgba(177,156,217,0.6), inset 0 0 20px rgba(255,255,255,0.2)',
            }}
          />
        )}
        {isDueToday && !medicationEntryToday && (
          <>
            {progressPercent > 0 && (
              <div 
                className="absolute top-0 h-full transition-all duration-300"
                style={{ 
                  left: 0,
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #9579be, #cdbcec, #9579be)',
                  boxShadow: '0 0 25px rgba(177,156,217,0.6), inset 0 0 20px rgba(255,255,255,0.2)',
                }}
              />
            )}
            {(() => {
              const hoursSinceMidnight = currentTime.getHours();
              const greenPercentSmooth = (hoursSinceMidnight / 24) * (100 - progressPercent);
              return (
                <div 
                  className="absolute top-0 h-full transition-all duration-300"
                  style={{ 
                    left: `${progressPercent}%`,
                    width: `${greenPercentSmooth}%`,
                    background: 'linear-gradient(90deg, #4ADEA8, #6EE7B7, #4ADEA8)',
                    boxShadow: '0 0 25px rgba(74,222,168,0.7), inset 0 0 20px rgba(255,255,255,0.2)',
                  }}
                />
              );
            })()}
          </>
        )}
        {medicationEntryToday && (
          <div 
            className="absolute top-0 h-full transition-all duration-300"
            style={{ 
              left: 0,
              width: '100%',
              background: 'linear-gradient(90deg, #4ADEA8, #6EE7B7, #4ADEA8)',
              boxShadow: '0 0 25px rgba(74,222,168,0.7), inset 0 0 20px rgba(255,255,255,0.2)',
            }}
          />
        )}
      </>
    );
  };

  const getDisplayText = () => {
    if (medicationEntryToday) {
      return 'Dose Logged for Today';
    }
    if (medicationIsOverdue && medicationDaysSinceLastDose > 0) {
      const daysOverdue = medicationDaysSinceLastDose - intervalDays;
      return `Overdue by ${daysOverdue} Day${daysOverdue !== 1 ? 's' : ''}`;
    }
    if (isScheduleStartDay) {
      return 'New Schedule - Log First Dose';
    }
    if (isDueToday) {
      return 'Dose Due Today - Log Now';
    }
    if (nextDueDays > 0) {
      return `${nextDueDays} Day${nextDueDays !== 1 ? 's' : ''} ${nextDueHours} Hour${nextDueHours !== 1 ? 's' : ''} Until Next Dose`;
    }
    if (nextDueDays < 0) {
      return `Overdue by ${Math.abs(nextDueDays)} Day${Math.abs(nextDueDays) !== 1 ? 's' : ''}`;
    }
    if (nextDueDays === 0) {
      return `${nextDueHours} Hour${nextDueHours !== 1 ? 's' : ''} Until Next Dose`;
    }
    return `DEBUG: ${nextDueDays}d ${nextDueHours}h isDueToday=${isDueToday}`;
  };

  const getButtonConfig = () => {
    const isDisabled = medicationIsOverdue && !isDueToday;
    const buttonText = isLogging 
      ? 'Logging...' 
      : isDisabled 
        ? 'Consult Your Healthcare Provider About The Missed Dose.'
        : medicationIsOverdue 
          ? 'Log Overdue Dose' 
          : 'Log Dose Now';
    
    return { isDisabled, buttonText };
  };

  if (!shouldShowProgress) return null;

  const { isDisabled, buttonText } = getButtonConfig();

  return (
    <div className="mb-4">
      <div className="relative overflow-hidden h-12 rounded-xl bg-gradient-to-r from-[#0d0d1a] via-[#1a1a2e] to-[#0d0d1a] border border-[#B19CD9]/40 shadow-[0_0_15px_rgba(177,156,217,0.2)]">
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(177,156,217,0.1) 10px, rgba(177,156,217,0.1) 20px)',
            animation: 'stripeMove 2s linear infinite'
          }}
        />
        {getProgressBarContent()}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {getDisplayText()}
          </span>
        </div>
      </div>
      <div className="flex justify-between mt-2 text-xs text-[#B19CD9]/70">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#4ADEA8]"></span>
          Last: {lastDoseDateStr}
        </span>
        <span className="font-medium" style={{ color: medicationColor?.stroke || '#B19CD9' }}>{medicationName}</span>
        <span className="flex items-center gap-1">
          Next: {nextDueDateStr}
          <span className="w-2 h-2 rounded-full bg-[#B19CD9]"></span>
        </span>
      </div>
      {(isDueToday || nextDueDays < 0 || (stats.isScheduleStartDay) || medicationIsOverdue) && !medicationEntryToday && (
        <button
          onClick={isDisabled ? undefined : onLogDose}
          disabled={isDisabled}
          className={`mt-2 w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
            isDisabled
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : medicationIsOverdue
                ? 'bg-gradient-to-r from-[#EF4444] to-[#F87171] text-white hover:scale-[1.02] animate-pulse'
                : 'bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white hover:scale-[1.02]'
          }`}
          style={{ 
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
            boxShadow: isDisabled
              ? 'none'
              : medicationIsOverdue
                ? '0 0 20px rgba(239,68,68,0.8), 0 0 40px rgba(239,68,68,0.4)' 
                : '0 0 10px rgba(74,222,168,0.5), 0 0 20px rgba(74,222,168,0.3)',
          }}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default MedicationProgressBar;
