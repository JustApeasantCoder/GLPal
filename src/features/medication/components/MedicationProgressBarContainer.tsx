import React, { useMemo } from 'react';
import { GLP1Entry, GLP1Protocol } from '../../../types';
import { MedicationStats } from '../hooks/useMedicationStats';
import { timeService } from '../../../core/timeService';
import { getMedicationColorByName } from '../../../shared/utils/chartUtils';

interface MedicationProgressBarContainerProps {
  medicationEntries: GLP1Entry[];
  protocols: GLP1Protocol[];
  currentTime: Date;
  latestDoseDone: number | null;
  medicationName: string;
  onLogDose: () => void;
  isLogging: boolean;
  allMedications: string[];
}

const calculateMedicationStats = (
  medicationEntries: GLP1Entry[],
  protocols: GLP1Protocol[],
  currentTime: Date,
  latestDoseDone: number | null,
  medicationName: string
): { stats: MedicationStats; activeProtocol: GLP1Protocol | undefined; doseLoggedToday: boolean } => {
  const toLocalDateStr = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseYmd = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  };

  const currentTimeDate = new Date(currentTime);
  const todayStr = toLocalDateStr(currentTimeDate);

  const filteredProtocols = protocols?.filter(p => p.medication === medicationName && !p.isArchived);
  const filteredEntries = medicationEntries.filter(e => e.medication === medicationName);

  const activeProtocol = filteredProtocols?.find(p => {
    const start = p.startDate;
    const end = p.stopDate || '2099-12-31';
    return todayStr >= start && todayStr <= end;
  });

  let intervalDays = 7;
  if (activeProtocol) {
    intervalDays = Math.round(7 / activeProtocol.frequencyPerWeek);
  }

  const sortedEntries = [...filteredEntries].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let lastScheduledDate: Date | null = null;
  let nextDueDays = 0;
  let nextDueHours = 0;
  let nextDueMinutes = 0;
  let nextDueSeconds = 0;
  let daysSinceLastDose = 0;
  let nextDueDateStr = 'N/A';
  let nextDoseDate: Date | null = null;

  const protocolStartDate = activeProtocol?.startDate || '';
  const todayTimestamp = currentTimeDate.getTime();

  if (activeProtocol && protocolStartDate) {
    const startTimestamp = parseYmd(protocolStartDate);
    const todayTimestampMidnight = parseYmd(todayStr);
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

    const daysSinceStart = Math.floor((todayTimestampMidnight - startTimestamp) / (24 * 60 * 60 * 1000));

    const fullIntervalsPassed = Math.floor(daysSinceStart / intervalDays);
    const dayWithinInterval = daysSinceStart % intervalDays;

    const nextDoseTimestamp = startTimestamp + (fullIntervalsPassed + (dayWithinInterval === 0 ? 0 : 1)) * intervalMs;
    const lastDoseTimestamp = nextDoseTimestamp - intervalMs;

    lastScheduledDate = new Date(lastDoseTimestamp);
    nextDoseDate = new Date(nextDoseTimestamp);

    daysSinceLastDose = (currentTimeDate.getTime() - lastDoseTimestamp) / (24 * 60 * 60 * 1000);

    const diffMs = nextDoseTimestamp - todayTimestamp;
    nextDueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    nextDueHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    nextDueMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    nextDueSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    nextDueDateStr = nextDoseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const lastDoseDate = lastScheduledDate;
  const lastDoseDateStr = lastDoseDate
    ? lastDoseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'N/A';

  if (!activeProtocol && lastDoseDate) {
    daysSinceLastDose = (currentTimeDate.getTime() - lastDoseDate.getTime()) / (1000 * 60 * 60 * 24);

    nextDoseDate = new Date(lastDoseDate.getTime() + (intervalDays * 24 * 60 * 60 * 1000));
    nextDueDateStr = nextDoseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const diffMs = nextDoseDate.getTime() - currentTimeDate.getTime();
    nextDueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    nextDueHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    nextDueMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    nextDueSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (diffMs < 0 && nextDueDays === 0) {
      nextDueHours = Math.ceil(diffMs / (1000 * 60 * 60));
      if (nextDueHours < 0) {
        nextDueDays = -1;
        nextDueHours = 24 + nextDueHours;
      }
    }
  }

  const totalDoses = filteredEntries.length;
  const totalCurrentDose = filteredEntries.length > 0 ? filteredEntries[0].dose : 0;

  const thisMonthDoses = filteredEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === currentTimeDate.getMonth() &&
           entryDate.getFullYear() === currentTimeDate.getFullYear();
  }).length;

  const upcomingDoses = (() => {
    if (!filteredProtocols || filteredProtocols.length === 0) return 0;

    const nextMonth = new Date(currentTimeDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    let count = 0;
    filteredProtocols.forEach(protocol => {
      const start = new Date(protocol.startDate);
      const end = protocol.stopDate ? new Date(protocol.stopDate) : nextMonth;
      const interval = 7 / protocol.frequencyPerWeek;

      let d = new Date(start);
      while (d <= end && d <= nextMonth) {
        if (d > currentTimeDate) count++;
        d = new Date(d.getTime() + interval * 24 * 60 * 60 * 1000);
      }
    });
    return count;
  })();

  const isScheduleStartDay = !!(activeProtocol && activeProtocol.startDate === todayStr);

  const nextDoseDateAtMidnight = nextDoseDate ? toLocalDateStr(nextDoseDate) : null;
  const isDueToday = nextDoseDateAtMidnight === todayStr;

  const stats: MedicationStats = {
    totalDoses,
    currentDoses: [],
    totalCurrentDose,
    nextDueDays,
    nextDueHours,
    nextDueMinutes,
    nextDueSeconds,
    nextDueDateStr,
    currentLevel: 0,
    thisMonth: thisMonthDoses,
    plannedDoses: upcomingDoses,
    lastDoseDateStr,
    daysSinceLastDose,
    intervalDays,
    isScheduleStartDay,
    isDueToday,
    latestDoseDone,
    isOverdue: (() => {
      if (!latestDoseDone) return false;
      const lastDate = new Date(latestDoseDone);
      const lastDateLocal = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      const todayLocal = new Date(currentTimeDate.getFullYear(), currentTimeDate.getMonth(), currentTimeDate.getDate());
      const daysDiff = Math.floor((todayLocal.getTime() - lastDateLocal.getTime()) / (24 * 60 * 60 * 1000));
      return daysDiff >= 8;
    })()
  };

  const todayStr2 = timeService.todayString();
  const doseLoggedToday = filteredEntries.some(entry => entry.date === todayStr2 && entry.isManual);

  return { stats, activeProtocol, doseLoggedToday };
};

const MedicationProgressBar = React.lazy(() => import('./MedicationProgressBar'));

export const MedicationProgressBarContainer: React.FC<MedicationProgressBarContainerProps> = ({
  medicationEntries,
  protocols,
  currentTime,
  latestDoseDone,
  medicationName,
  onLogDose,
  isLogging,
  allMedications,
}) => {
  const { stats, activeProtocol, doseLoggedToday } = useMemo(
    () => calculateMedicationStats(medicationEntries, protocols, currentTime, latestDoseDone, medicationName),
    [medicationEntries, protocols, currentTime, latestDoseDone, medicationName]
  );

  const medicationColor = useMemo(
    () => getMedicationColorByName(medicationName, allMedications),
    [medicationName, allMedications]
  );

  return (
    <React.Suspense fallback={<div className="h-12 bg-black/30 animate-pulse rounded-xl"></div>}>
      <MedicationProgressBar
        stats={stats}
        doseLoggedToday={doseLoggedToday}
        currentTime={currentTime}
        onLogDose={onLogDose}
        isLogging={isLogging}
        medicationName={medicationName}
        medicationColor={medicationColor}
        activeProtocol={activeProtocol}
      />
    </React.Suspense>
  );
};

export default MedicationProgressBarContainer;
