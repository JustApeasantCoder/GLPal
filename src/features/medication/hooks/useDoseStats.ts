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
    
    const sortedEntries = [...medicationEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
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
      
      if (lastDoseDate) {
        daysSinceLastDose = (currentTime.getTime() - lastDoseDate.getTime()) / (1000 * 60 * 60 * 24);
      }
      
      if (diffMs < 0 && nextDueDays === 0) {
        nextDueHours = Math.ceil(diffMs / (1000 * 60 * 60));
        if (nextDueHours < 0) {
          nextDueDays = -1;
          nextDueHours = 24 + nextDueHours;
        }
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
      
      if (diffMs < 0 && nextDueDays === 0) {
        nextDueHours = Math.ceil(diffMs / (1000 * 60 * 60));
        if (nextDueHours < 0) {
          nextDueDays = -1;
          nextDueHours = 24 + nextDueHours;
        }
      }
    }
    
    const totalDoses = medicationEntries.length;
    const totalCurrentDose = medicationEntries.length > 0 ? medicationEntries[0].dose : 0;
    
    const nowDate = new Date(now);
    const thisMonthDoses = medicationEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === nowDate.getMonth() && 
             entryDate.getFullYear() === nowDate.getFullYear();
    }).length;
    
    const upcomingDoses = (() => {
      if (!protocols || protocols.length === 0) return 0;
      const activeProtocols = protocols.filter(p => !p.isArchived);
      if (activeProtocols.length === 0) return 0;
      
      const nextMonth = new Date(nowDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      let count = 0;
      activeProtocols.forEach(protocol => {
        const start = new Date(protocol.startDate);
        const end = protocol.stopDate ? new Date(protocol.stopDate) : nextMonth;
        const intervalDaysVal = 7 / protocol.frequencyPerWeek;
        
        let d = new Date(start);
        while (d <= end && d <= nextMonth) {
          if (d > nowDate) count++;
          d = new Date(d.getTime() + intervalDaysVal * 24 * 60 * 60 * 1000);
        }
      });
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
