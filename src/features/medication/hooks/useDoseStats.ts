import { useMemo } from 'react';
import { GLP1Entry, GLP1Protocol } from '../../../types';
import { useTime } from '../../../shared/hooks';

export interface DoseStats {
  totalDoses: number;
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
  intervalDays: number;
}

export const useDoseStats = (
  medicationEntries: GLP1Entry[],
  protocols: GLP1Protocol[]
): DoseStats => {
  const now = useTime(100);

  return useMemo(() => {
    const currentTime = new Date(now);
    currentTime.setHours(0, 0, 0, 0);
    
    const activeProtocol = protocols?.find(p => {
      if (p.isArchived) return false;
      const start = new Date(p.startDate);
      const end = p.stopDate ? new Date(p.stopDate) : new Date('2099-12-31');
      return currentTime >= start && currentTime <= end;
    });
    
    let intervalDays = 7;
    if (activeProtocol) {
      intervalDays = Math.round(7 / activeProtocol.frequencyPerWeek);
    }
    
    // Get manual/logged entries for this month
    const manualEntries = medicationEntries.filter(e => e.isManual);
    const thisMonthDoses = manualEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const nowDate = new Date(now);
      return entryDate.getMonth() === nowDate.getMonth() && 
             entryDate.getFullYear() === nowDate.getFullYear();
    }).length;
    
    // Find last scheduled dose based on active protocol
    let lastScheduledDate: Date | null = null;
    if (activeProtocol) {
      const protocolStart = new Date(activeProtocol.startDate);
      const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
      
      let scheduledDate = new Date(protocolStart);
      while (scheduledDate <= currentTime) {
        lastScheduledDate = new Date(scheduledDate);
        scheduledDate = new Date(scheduledDate.getTime() + intervalMs);
      }
    }
    
    const lastDoseDate = lastScheduledDate;
    const lastDoseDateStr = lastDoseDate 
      ? lastDoseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'N/A';
    
    let nextDueDays = 0;
    let nextDueHours = 0;
    let nextDueMinutes = 0;
    let nextDueSeconds = 0;
    let daysSinceLastDose = 0;
    let nextDueDateStr = 'N/A';
    let nextDoseDate: Date | null = null;
    
    if (activeProtocol) {
      const protocolStart = new Date(activeProtocol.startDate);
      const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
      
      // Find next scheduled dose
      let scheduledDate = new Date(protocolStart);
      while (scheduledDate <= currentTime) {
        scheduledDate = new Date(scheduledDate.getTime() + intervalMs);
      }
      nextDoseDate = scheduledDate;
      nextDueDateStr = nextDoseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const diffMs = nextDoseDate.getTime() - currentTime.getTime();
      nextDueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      nextDueHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      nextDueMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      nextDueSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      // Fix overdue: if diff is negative, we're overdue
      if (diffMs < 0) {
        nextDueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        nextDueHours = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      }
      
      if (lastDoseDate) {
        daysSinceLastDose = (currentTime.getTime() - lastDoseDate.getTime()) / (1000 * 60 * 60 * 24);
      }
    } else if (lastDoseDate) {
      daysSinceLastDose = (currentTime.getTime() - lastDoseDate.getTime()) / (1000 * 60 * 60 * 24);
      
      nextDoseDate = new Date(lastDoseDate.getTime() + (intervalDays * 24 * 60 * 60 * 1000));
      nextDueDateStr = nextDoseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const diffMs = nextDoseDate.getTime() - currentTime.getTime();
      nextDueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      nextDueHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      nextDueMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      nextDueSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      if (diffMs < 0) {
        nextDueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        nextDueHours = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      }
    }
    
    const totalDoses = manualEntries.length;
    const totalCurrentDose = activeProtocol ? activeProtocol.dose : (manualEntries.length > 0 ? manualEntries[0].dose : 0);
    
    // Planned doses: count future scheduled doses from active protocol
    const upcomingDoses = (() => {
      if (!activeProtocol) return 0;
      
      const protocolEnd = activeProtocol.stopDate 
        ? new Date(activeProtocol.stopDate)
        : new Date(currentTime);
      protocolEnd.setMonth(protocolEnd.getMonth() + 3); // Look 3 months ahead
      
      const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
      let scheduledDate = new Date(activeProtocol.startDate);
      
      // Find the next scheduled dose after current time
      while (scheduledDate <= currentTime) {
        scheduledDate = new Date(scheduledDate.getTime() + intervalMs);
      }
      
      let count = 0;
      while (scheduledDate <= protocolEnd) {
        count++;
        scheduledDate = new Date(scheduledDate.getTime() + intervalMs);
      }
      return count;
    })();
    
    return { 
      totalDoses, 
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
      intervalDays 
    };
  }, [medicationEntries, protocols, now]);
};
