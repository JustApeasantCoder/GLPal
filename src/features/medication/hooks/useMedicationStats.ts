import { useMemo } from 'react';
import { GLP1Protocol, GLP1Entry } from '../../../types';
import { timeService } from '../../../core/timeService';

export interface MedicationStats {
  totalDoses: number;
  currentDoses: never[];
  totalCurrentDose: number;
  nextDueDays: number;
  nextDueHours: number;
  nextDueMinutes: number;
  nextDueSeconds: number;
  nextDueDateStr: string;
  currentLevel: number;
  thisMonth: number;
  plannedDoses: number;
  lastDoseDateStr: string;
  daysSinceLastDose: number;
  actualDaysSinceLastDose: number;
  intervalDays: number;
  isScheduleStartDay: boolean;
  isDueToday: boolean;
  latestDoseDone: number | null;
  isOverdue: boolean;
  semaglutideIsOverdue: boolean;
  tirzepatideIsOverdue: boolean;
  retatrutideIsOverdue: boolean;
  cagrilintideIsOverdue: boolean;
  semaglutideEntryToday: boolean;
  tirzepatideEntryToday: boolean;
  retatrutideEntryToday: boolean;
  cagrilintideEntryToday: boolean;
  semaglutideDaysSinceLastDose: number;
  tirzepatideDaysSinceLastDose: number;
  retatrutideDaysSinceLastDose: number;
  cagrilintideDaysSinceLastDose: number;
}

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

export const useMedicationStats = (
  medicationEntries: GLP1Entry[],
  protocols: GLP1Protocol[],
  currentTime: Date,
  latestDoseDone: number | null,
  medicationName?: string
): MedicationStats => {
  return useMemo(() => {
    const currentTimeDate = new Date(currentTime);
    const currentTimeMidnight = new Date(currentTimeDate.getFullYear(), currentTimeDate.getMonth(), currentTimeDate.getDate(), 0, 0, 0, 0);
    const todayStr = toLocalDateStr(currentTimeDate);
    
    const filteredProtocols = medicationName
      ? protocols?.filter(p => p.medication === medicationName && !p.isArchived)
      : protocols?.filter(p => !p.isArchived);
    
    const filteredEntries = medicationName
      ? medicationEntries.filter(e => e.medication === medicationName)
      : medicationEntries;
    
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
      filteredProtocols!.forEach(protocol => {
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
    
    return { 
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
        if (filteredEntries.length === 0) return false;
        const sortedEntries = [...filteredEntries].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const lastEntry = sortedEntries[0];
        if (!lastEntry) return false;
        const lastDate = new Date(lastEntry.date);
        const lastDateLocal = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
        const todayLocal = new Date(currentTimeDate.getFullYear(), currentTimeDate.getMonth(), currentTimeDate.getDate());
        const daysDiff = Math.floor((todayLocal.getTime() - lastDateLocal.getTime()) / (24 * 60 * 60 * 1000));
        return daysDiff >= 8;
      })(),
      actualDaysSinceLastDose: (() => {
        if (filteredEntries.length === 0) return 0;
        const sortedEntries = [...filteredEntries].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const lastEntry = sortedEntries[0];
        if (!lastEntry) return 0;
        const lastDate = new Date(lastEntry.date);
        const lastDateLocal = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
        const todayLocal = new Date(currentTimeDate.getFullYear(), currentTimeDate.getMonth(), currentTimeDate.getDate());
        return Math.floor((todayLocal.getTime() - lastDateLocal.getTime()) / (24 * 60 * 60 * 1000));
      })(),
      semaglutideIsOverdue: (() => {
        const semaglutideEntries = medicationEntries.filter(e => e.medication.toLowerCase().includes('semaglutide') && e.isManual);
        if (semaglutideEntries.length === 0) return false;
        const sorted = [...semaglutideEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastEntry = sorted[0];
        if (!lastEntry) return false;
        const [y, m, d] = lastEntry.date.split('-').map(Number);
        const lastDateLocal = new Date(y, m - 1, d);
        const todayLocal = new Date(currentTimeDate.getFullYear(), currentTimeDate.getMonth(), currentTimeDate.getDate());
        const daysDiff = Math.floor((todayLocal.getTime() - lastDateLocal.getTime()) / (24 * 60 * 60 * 1000));
        return daysDiff >= 8;
      })(),
      tirzepatideIsOverdue: (() => {
        const tirzepatideEntries = medicationEntries.filter(e => e.medication.toLowerCase().includes('tirzepatide') && e.isManual);
        if (tirzepatideEntries.length === 0) return false;
        const sorted = [...tirzepatideEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastEntry = sorted[0];
        if (!lastEntry) return false;
        const [y, m, d] = lastEntry.date.split('-').map(Number);
        const lastDateLocal = new Date(y, m - 1, d);
        const todayLocal = new Date(currentTimeDate.getFullYear(), currentTimeDate.getMonth(), currentTimeDate.getDate());
        const daysDiff = Math.floor((todayLocal.getTime() - lastDateLocal.getTime()) / (24 * 60 * 60 * 1000));
        return daysDiff >= 8;
      })(),
      retatrutideIsOverdue: (() => {
        const retatrutideEntries = medicationEntries.filter(e => e.medication.toLowerCase().includes('retatrutide') && e.isManual);
        if (retatrutideEntries.length === 0) return false;
        const sorted = [...retatrutideEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastEntry = sorted[0];
        if (!lastEntry) return false;
        const [y, m, d] = lastEntry.date.split('-').map(Number);
        const lastDateLocal = new Date(y, m - 1, d);
        const todayLocal = new Date(currentTimeDate.getFullYear(), currentTimeDate.getMonth(), currentTimeDate.getDate());
        const daysDiff = Math.floor((todayLocal.getTime() - lastDateLocal.getTime()) / (24 * 60 * 60 * 1000));
        return daysDiff >= 8;
      })(),
      cagrilintideIsOverdue: (() => {
        const cagrilintideEntries = medicationEntries.filter(e => e.medication.toLowerCase().includes('cagrilintide') && e.isManual);
        if (cagrilintideEntries.length === 0) return false;
        const sorted = [...cagrilintideEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastEntry = sorted[0];
        if (!lastEntry) return false;
        const [y, m, d] = lastEntry.date.split('-').map(Number);
        const lastDateLocal = new Date(y, m - 1, d);
        const todayLocal = new Date(currentTimeDate.getFullYear(), currentTimeDate.getMonth(), currentTimeDate.getDate());
        const daysDiff = Math.floor((todayLocal.getTime() - lastDateLocal.getTime()) / (24 * 60 * 60 * 1000));
        return daysDiff >= 8;
      })(),
      semaglutideEntryToday: medicationEntries.some(e => e.medication.toLowerCase().includes('semaglutide') && e.date === todayStr && e.isManual),
      tirzepatideEntryToday: medicationEntries.some(e => e.medication.toLowerCase().includes('tirzepatide') && e.date === todayStr && e.isManual),
      retatrutideEntryToday: medicationEntries.some(e => e.medication.toLowerCase().includes('retatrutide') && e.date === todayStr && e.isManual),
      cagrilintideEntryToday: medicationEntries.some(e => e.medication.toLowerCase().includes('cagrilintide') && e.date === todayStr && e.isManual),
      semaglutideDaysSinceLastDose: (() => {
        const semaglutideEntries = medicationEntries.filter(e => e.medication.toLowerCase().includes('semaglutide') && e.isManual);
        if (semaglutideEntries.length === 0) return 0;
        const sorted = [...semaglutideEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastEntry = sorted[0];
        if (!lastEntry) return 0;
        const [y, m, d] = lastEntry.date.split('-').map(Number);
        const lastDateLocal = new Date(y, m - 1, d);
        const todayLocal = new Date(currentTimeDate.getFullYear(), currentTimeDate.getMonth(), currentTimeDate.getDate());
        return Math.floor((todayLocal.getTime() - lastDateLocal.getTime()) / (24 * 60 * 60 * 1000));
      })(),
      tirzepatideDaysSinceLastDose: (() => {
        const tirzepatideEntries = medicationEntries.filter(e => e.medication.toLowerCase().includes('tirzepatide') && e.isManual);
        if (tirzepatideEntries.length === 0) return 0;
        const sorted = [...tirzepatideEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastEntry = sorted[0];
        if (!lastEntry) return 0;
        const [y, m, d] = lastEntry.date.split('-').map(Number);
        const lastDateLocal = new Date(y, m - 1, d);
        const todayLocal = new Date(currentTimeDate.getFullYear(), currentTimeDate.getMonth(), currentTimeDate.getDate());
        return Math.floor((todayLocal.getTime() - lastDateLocal.getTime()) / (24 * 60 * 60 * 1000));
      })(),
      retatrutideDaysSinceLastDose: (() => {
        const retatrutideEntries = medicationEntries.filter(e => e.medication.toLowerCase().includes('retatrutide') && e.isManual);
        if (retatrutideEntries.length === 0) return 0;
        const sorted = [...retatrutideEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastEntry = sorted[0];
        if (!lastEntry) return 0;
        const [y, m, d] = lastEntry.date.split('-').map(Number);
        const lastDateLocal = new Date(y, m - 1, d);
        const todayLocal = new Date(currentTimeDate.getFullYear(), currentTimeDate.getMonth(), currentTimeDate.getDate());
        return Math.floor((todayLocal.getTime() - lastDateLocal.getTime()) / (24 * 60 * 60 * 1000));
      })(),
      cagrilintideDaysSinceLastDose: (() => {
        const cagrilintideEntries = medicationEntries.filter(e => e.medication.toLowerCase().includes('cagrilintide') && e.isManual);
        if (cagrilintideEntries.length === 0) return 0;
        const sorted = [...cagrilintideEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastEntry = sorted[0];
        if (!lastEntry) return 0;
        const [y, m, d] = lastEntry.date.split('-').map(Number);
        const lastDateLocal = new Date(y, m - 1, d);
        const todayLocal = new Date(currentTimeDate.getFullYear(), currentTimeDate.getMonth(), currentTimeDate.getDate());
        return Math.floor((todayLocal.getTime() - lastDateLocal.getTime()) / (24 * 60 * 60 * 1000));
      })(),
    };
  }, [medicationEntries, protocols, currentTime, latestDoseDone, medicationName]);
};

export const isMedicationOverdue = (
  medicationEntries: GLP1Entry[],
  medicationName: string,
  currentTime: Date
): boolean => {
  const filteredEntries = medicationEntries.filter(e => e.medication === medicationName);
  if (filteredEntries.length === 0) return false;
  
  const sortedEntries = [...filteredEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const lastEntry = sortedEntries[0];
  if (!lastEntry) return false;
  
  const lastDate = new Date(lastEntry.date);
  const lastDateLocal = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const todayLocal = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
  const daysDiff = Math.floor((todayLocal.getTime() - lastDateLocal.getTime()) / (24 * 60 * 60 * 1000));
  return daysDiff >= 8;
};

export const useActiveProtocol = (protocols: GLP1Protocol[]): GLP1Protocol | undefined => {
  return useMemo(() => {
    const todayStr = timeService.todayString();
    return protocols?.find(p => {
      if (p.isArchived) return false;
      const start = p.startDate;
      const end = p.stopDate || '2099-12-31';
      return todayStr >= start && todayStr <= end;
    });
  }, [protocols]);
};
