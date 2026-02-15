import { useMemo } from 'react';
import { GLP1Entry, GLP1Protocol } from '../../../types';
import { useTime } from '../../../shared/hooks';
import { calculateMedicationConcentration } from '../../../shared/utils/calculations';

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
  loggedDoses: number;
}

export const useDoseStats = (
  medicationEntries: GLP1Entry[],
  protocols: GLP1Protocol[]
): DoseStats => {
  const now = useTime(1000); // Update every second for smooth progress

  return useMemo(() => {
    const currentTime = new Date(now);
    currentTime.setHours(0, 0, 0, 0);
    
    // Get active (non-archived) protocols
    const activeProtocols = protocols?.filter(p => {
      if (p.isArchived) return false;
      const start = new Date(p.startDate);
      const end = p.stopDate ? new Date(p.stopDate) : new Date('2099-12-31');
      return currentTime >= start && currentTime <= end;
    }) || [];
    
    // Use the first active protocol for interval calculation
    const activeProtocol = activeProtocols[0] || null;
    
    let intervalDays = 7;
    if (activeProtocol) {
      intervalDays = Math.round(7 / activeProtocol.frequencyPerWeek);
    }
    
    // Logged doses = all entries
    const loggedDoses = medicationEntries.length;
    
    // Get entries for this month
    const thisMonthDoses = medicationEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const nowDate = new Date(now);
      return entryDate.getMonth() === nowDate.getMonth() && 
             entryDate.getFullYear() === nowDate.getFullYear();
    }).length;
    
    // Calculate planned doses: from Today to protocol end (future only)
    let plannedDoses = 0;
    if (activeProtocols.length > 0) {
      activeProtocols.forEach(protocol => {
        const protocolEnd = protocol.stopDate 
          ? new Date(protocol.stopDate) 
          : new Date(currentTime.getTime() + 90 * 24 * 60 * 60 * 1000);
        
        const intervalMs = (7 / protocol.frequencyPerWeek) * 24 * 60 * 60 * 1000;
        
        let scheduledDate = new Date(currentTime);
        scheduledDate.setHours(0, 0, 0, 0);
        
        while (scheduledDate <= protocolEnd) {
          if (scheduledDate >= currentTime) {
            plannedDoses++;
          }
          scheduledDate = new Date(scheduledDate.getTime() + intervalMs);
        }
      });
    }
    
    const totalDoses = loggedDoses;
    
    // Current dose = sum of all active protocol doses
    const totalCurrentDose = activeProtocols.reduce((sum, p) => sum + p.dose, 0);
    
    // Find the LAST LOGGED dose date (most recent actual entry)
    let lastLoggedDate: Date | null = null;
    if (medicationEntries.length > 0) {
      // Sort by date descending to get the most recent
      const sortedEntries = [...medicationEntries].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Get the most recent entry
      const latestEntry = sortedEntries[0];
      if (latestEntry) {
        // Parse the date string carefully to avoid timezone issues
        const dateParts = latestEntry.date.split('T')[0].split('-');
        lastLoggedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        lastLoggedDate.setHours(0, 0, 0, 0);
      }
    }
    
    // Calculate days since last dose (include fractional days for smooth progress)
    let daysSinceLastDose = 0;
    if (lastLoggedDate) {
      const diffTime = currentTime.getTime() - lastLoggedDate.getTime();
      daysSinceLastDose = diffTime / (1000 * 60 * 60 * 24); // Use fractional days
      
      // Guard against negative values (future dates) or unreasonably high values
      if (daysSinceLastDose < 0) daysSinceLastDose = 0;
      if (daysSinceLastDose > 365) daysSinceLastDose = 0; // Reset if too old
    }
    
    // Next due date = last logged date + interval
    let nextDoseDate: Date | null = null;
    if (lastLoggedDate) {
      nextDoseDate = new Date(lastLoggedDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    }
    
    let nextDueDays = 0;
    let nextDueHours = 0;
    let nextDueMinutes = 0;
    let nextDueSeconds = 0;
    let nextDueDateStr = 'N/A';
    
    if (nextDoseDate) {
      nextDueDateStr = nextDoseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const diffMs = nextDoseDate.getTime() - currentTime.getTime();
      nextDueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      nextDueHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      nextDueMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      nextDueSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      // Guard: if next due is more than 30 days away, cap it
      if (nextDueDays > 30) {
        nextDueDays = nextDueDays % intervalDays;
      }
      
      // If overdue (diff is negative)
      if (diffMs < 0) {
        nextDueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        nextDueHours = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      }
    }
    
    const lastDoseDateStr = lastLoggedDate 
      ? lastLoggedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'N/A';
    
    // Calculate current level based on Today's date
    const todayDate = new Date(currentTime);
    todayDate.setHours(0, 0, 0, 0);
    
    const currentLevel = (() => {
      if (medicationEntries.length === 0) return 0;
      
      const dosesByMed: Record<string, { date: Date; dose: number }[]> = {};
      const halfLifeByMed: Record<string, number> = {};
      
      medicationEntries.forEach(entry => {
        const medName = entry.medication;
        if (!dosesByMed[medName]) {
          dosesByMed[medName] = [];
          halfLifeByMed[medName] = entry.halfLifeHours || 120;
        }
        
        const dateParts = entry.date.split('T')[0].split('-');
        const entryDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        entryDate.setHours(0, 0, 0, 0);
        
        dosesByMed[medName].push({
          date: entryDate,
          dose: entry.dose
        });
      });
      
      let totalConcentration = 0;
      Object.keys(dosesByMed).forEach(med => {
        totalConcentration += calculateMedicationConcentration(
          dosesByMed[med],
          halfLifeByMed[med],
          todayDate
        );
      });
      
      return totalConcentration;
    })();
    
    return { 
      totalDoses, 
      totalCurrentDose, 
      nextDueDays, 
      nextDueHours, 
      nextDueMinutes, 
      nextDueSeconds, 
      nextDueDateStr, 
      currentLevel, 
      thisMonth: thisMonthDoses, 
      plannedDoses, 
      lastDoseDateStr, 
      daysSinceLastDose, 
      intervalDays,
      loggedDoses
    };
  }, [medicationEntries, protocols, now]);
};
