import React, { useState, useMemo, useEffect } from 'react';
import MedicationChart from './components/MedicationChart';
import MedicationModal from './components/MedicationModal';
import LogDoseModal from './components/LogDoseModal';
import PeriodSelector from '../../shared/components/PeriodSelector';
import ProtocolModal from './components/ProtocolModal';
import Button from '../../shared/components/Button';
import DateWheelPickerModal from '../../shared/components/DateWheelPickerModal';
import { GLP1Entry, GLP1Protocol } from '../../types';
import { ChartPeriod, useTime } from '../../shared/hooks';
import { useThemeStyles } from '../../contexts/ThemeContext';
import { calculateMedicationConcentration } from '../../shared/utils/calculations';
import { addMedicationGeneratedEntry, addMedicationManualEntry, clearMedicationEntries, deleteMedicationProtocol, saveMedicationProtocols, getMedicationManualEntries } from '../../shared/utils/database';
import { MEDICATIONS, formatDateShort, formatFrequency, generateId } from '../../constants/medications';
import { generateDosesFromProtocols, saveProtocol, deleteProtocol, archiveProtocol, getActiveProtocols } from '../../services/MedicationService';

interface MedicationTabProps {
  medicationEntries: GLP1Entry[];
  onAddMedication: (dose: number, medication: string, date: string) => void;
  onRefreshMedications: () => void;
  onLogDose: () => void;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (period: ChartPeriod) => void;
}

const MedicationTab: React.FC<MedicationTabProps> = ({ medicationEntries, onAddMedication, onRefreshMedications, onLogDose, chartPeriod, onChartPeriodChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogDoseModal, setShowLogDoseModal] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [activeProtocolForModal, setActiveProtocolForModal] = useState<GLP1Protocol | null>(null);
  const [protocols, setProtocols] = useState<GLP1Protocol[]>([]);
  const [editingProtocol, setEditingProtocol] = useState<GLP1Protocol | null>(null);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [protocolModalMode, setProtocolModalMode] = useState<'add' | 'edit'>('add');
  const [showOfficialScheduleModal, setShowOfficialScheduleModal] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);
  const [officialScheduleMedication, setOfficialScheduleMedication] = useState<string>('semaglutide');
  const [officialScheduleStartDate, setOfficialScheduleStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [officialScheduleSplitDosing, setOfficialScheduleSplitDosing] = useState(false);
  const [showOfficialScheduleDatePicker, setShowOfficialScheduleDatePicker] = useState(false);
  const [deleteConfirmMed, setDeleteConfirmMed] = useState<string | null>(null);
  const [collapsedMedications, setCollapsedMedications] = useState<Set<string>>(new Set());
  const { bigCard, bigCardText, smallCard, text } = useThemeStyles();

  useEffect(() => {
    const savedProtocols = getActiveProtocols();
    setProtocols(savedProtocols);
    if (savedProtocols.length > 0) {
      const medNames = new Set(savedProtocols.map(p => {
        const med = MEDICATIONS.find(m => m.id === p.medication);
        return med?.name || p.medication;
      }));
    }
  }, []);

  const handleGenerateDoses = (protocolList: GLP1Protocol[]) => {
    clearMedicationEntries();
    const generatedDoses = generateDosesFromProtocols(protocolList, []);
    generatedDoses.forEach(entry => addMedicationGeneratedEntry(entry));
    
    // Auto-log past and today's doses
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    protocolList.forEach(protocol => {
      if (protocol.isArchived) return;
      
      const start = new Date(protocol.startDate);
      const stop = protocol.stopDate ? new Date(protocol.stopDate) : now;
      const intervalDays = 7 / protocol.frequencyPerWeek;
      
      let d = new Date(start);
      while (d <= stop && d <= now) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Check if already logged
        const existingManual = getMedicationManualEntries();
        const alreadyLogged = existingManual.some(e => e.date === dateStr && e.medication === protocol.medication);
        
        if (!alreadyLogged) {
          // Auto-log this dose
          const manualEntry: GLP1Entry = {
            date: dateStr,
            medication: protocol.medication,
            dose: protocol.dose,
            halfLifeHours: protocol.halfLifeHours,
            isManual: true
          };
          addMedicationManualEntry(manualEntry);
        }
        
        d = new Date(d.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      }
    });
  };

  const toggleMedication = (medicationName: string) => {
    setCollapsedMedications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(medicationName)) {
        newSet.delete(medicationName);
      } else {
        newSet.add(medicationName);
      }
      return newSet;
    });
  };

  const handleDeleteMedication = (medicationName: string) => {
    let updatedProtocols = [...protocols];
    protocols.forEach(p => {
      const med = MEDICATIONS.find(m => m.id === p.medication);
      if ((med?.name || p.medication) === medicationName) {
        deleteMedicationProtocol(p.id);
        updatedProtocols = updatedProtocols.filter(proc => proc.id !== p.id);
      }
    });
    saveMedicationProtocols(updatedProtocols);
    setProtocols(updatedProtocols);
    handleGenerateDoses(updatedProtocols);
    onRefreshMedications();
    setCollapsedMedications(prev => {
      const newSet = new Set(prev);
      newSet.delete(medicationName);
      return newSet;
    });
    setDeleteConfirmMed(null);
  };

  const handleSaveProtocol = (protocol: GLP1Protocol) => {
    const updatedProtocols = saveProtocol(protocol, protocols);
    setProtocols(updatedProtocols);
    handleGenerateDoses(updatedProtocols);
    onRefreshMedications();
  };

  const handleEditProtocol = (protocol: GLP1Protocol) => {
    setEditingProtocol(protocol);
    setProtocolModalMode('edit');
    setIsProtocolModalOpen(true);
  };

  const handleDeleteProtocol = (id: string) => {
    const updatedList = deleteProtocol(id, protocols);
    setProtocols(updatedList);
    setEditingProtocol(null);
    onRefreshMedications();
  };

  const handleArchiveProtocol = (protocol: GLP1Protocol) => {
    const updatedList = archiveProtocol(protocol, protocols);
    setProtocols(updatedList);
    setEditingProtocol(null);
    onRefreshMedications();
  };

  const handleRegenerate = () => {
    if (protocols && protocols.length > 0) {
      handleGenerateDoses(protocols);
    }
  };

  const handleLogDoseNow = () => {
    const activeProtocol = protocols?.find(p => {
      if (p.isArchived) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(p.startDate);
      const end = p.stopDate ? new Date(p.stopDate) : new Date('2099-12-31');
      return today >= start && today <= end;
    });

    if (activeProtocol) {
      setIsLogging(true);
      setActiveProtocolForModal(activeProtocol);
      setShowLogDoseModal(true);
    } else {
      setIsModalOpen(true);
    }
  };

  // Use time hook for live updates (every 100ms) - uses timeService internally
  const now = useTime(100);

  // Calculate stats based on real dates + simulated time
  const stats = (() => {
    const currentTime = new Date(now);
    currentTime.setHours(0, 0, 0, 0);
    
    // Find active protocol (the one that covers today's date)
    const activeProtocol = protocols?.find(p => {
      if (p.isArchived) return false;
      const start = new Date(p.startDate);
      const end = p.stopDate ? new Date(p.stopDate) : new Date('2099-12-31');
      return currentTime >= start && currentTime <= end;
    });
    
    // Get interval from active protocol (default 7 days)
    let intervalDays = 7;
    if (activeProtocol) {
      intervalDays = Math.round(7 / activeProtocol.frequencyPerWeek);
    }
    
    // Get all medication entries (both generated and manually logged)
    const sortedEntries = [...medicationEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Find last scheduled dose based on active protocol (most recent dose on or before today)
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
    
    // Calculate next dose based on active protocol schedule
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
      
      // Find the next scheduled dose after current time
      let scheduledDate = new Date(protocolStart);
      while (scheduledDate <= currentTime) {
        scheduledDate = new Date(scheduledDate.getTime() + intervalMs);
      }
      nextDoseDate = scheduledDate;
      nextDueDateStr = nextDoseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Time remaining until next dose
      const diffMs = nextDoseDate.getTime() - currentTime.getTime();
      nextDueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      nextDueHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      nextDueMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      nextDueSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      // Days since last dose (with fractional days for smooth animation)
      if (lastDoseDate) {
        daysSinceLastDose = (currentTime.getTime() - lastDoseDate.getTime()) / (1000 * 60 * 60 * 24);
      }
      
      // Fix negative hours
      if (diffMs < 0 && nextDueDays === 0) {
        nextDueHours = Math.ceil(diffMs / (1000 * 60 * 60));
        if (nextDueHours < 0) {
          nextDueDays = -1;
          nextDueHours = 24 + nextDueHours;
        }
      }
    } else if (lastDoseDate) {
      // Fallback to last dose + interval if no active protocol
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
        const intervalDays = 7 / protocol.frequencyPerWeek;
        
        let d = new Date(start);
        while (d <= end && d <= nextMonth) {
          if (d > nowDate) count++;
          d = new Date(d.getTime() + intervalDays * 24 * 60 * 60 * 1000);
        }
      });
      return count;
    })();
    
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
      intervalDays 
    };
  })();

  return (
    <div className="space-y-3">
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Doses</h1>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        <div className="space-y-3 mb-6">
          {/* Progress Bar - Next Dose Countdown */}
          {stats.lastDoseDateStr !== 'N/A' && (
            <div className="mb-4">
              {/* Outer container with glow - rounded */}
              <div className="relative overflow-hidden h-12 rounded-xl bg-gradient-to-r from-[#0d0d1a] via-[#1a1a2e] to-[#0d0d1a] border border-[#B19CD9]/40 shadow-[0_0_30px_rgba(177,156,217,0.2)]">
                {/* Animated background stripes */}
                <div className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(177,156,217,0.1) 10px, rgba(177,156,217,0.1) 20px)',
                    animation: 'stripeMove 2s linear infinite'
                  }}
                />
                {/* Progress Fill with segmented colors */}
                {(() => {
                  const progressPercent = Math.min(100, Math.max(0, (stats.daysSinceLastDose / stats.intervalDays) * 100));
                  const greenThreshold = (6 / 7) * 100; // Green starts at ~86% (6 days passed, 1 day left)
                  const isOverdue = stats.nextDueDays < 0 || (stats.nextDueDays === 0 && stats.nextDueHours < 0);
                  
                  return (
                    <>
                      {/* Purple portion (full progress or overdue) */}
                      {progressPercent > 0 && (
                        <div 
                          className="absolute top-0 h-full transition-all duration-300"
                          style={{ 
                            left: 0,
                            width: `${progressPercent}%`,
                            background: isOverdue 
                              ? 'linear-gradient(90deg, #EF4444, #F87171, #EF4444)'
                              : 'linear-gradient(90deg, #B19CD9, #D4B8E8, #B19CD9)',
                            boxShadow: isOverdue
                              ? '0 0 25px rgba(239,68,68,0.7), inset 0 0 20px rgba(255,255,255,0.2)'
                              : '0 0 25px rgba(177,156,217,0.6), inset 0 0 20px rgba(255,255,255,0.2)',
                          }}
                        />
                      )}
                      {/* Green overlay (last day portion) */}
                      {!isOverdue && progressPercent > greenThreshold && (
                        <div 
                          className="absolute top-0 h-full transition-all duration-300"
                          style={{ 
                            left: `${greenThreshold}%`,
                            width: `${progressPercent - greenThreshold}%`,
                            background: 'linear-gradient(90deg, #4ADEA8, #6EE7B7, #4ADEA8)',
                            boxShadow: '0 0 25px rgba(74,222,168,0.7), inset 0 0 20px rgba(255,255,255,0.2)',
                          }}
                        />
                      )}
                    </>
                  );
                })()}
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {stats.nextDueDays > 0 
                      ? `${stats.nextDueDays} Day${stats.nextDueDays !== 1 ? 's' : ''} ${stats.nextDueHours} Hour${stats.nextDueHours !== 1 ? 's' : ''} Until Next Dose`
                      : (stats.nextDueDays === 0 && stats.nextDueHours >= 0)
                        ? `${stats.nextDueHours} Hour${stats.nextDueHours !== 1 ? 's' : ''} ${stats.nextDueMinutes} Minute${stats.nextDueMinutes !== 1 ? 's' : ''} Remaining`
                        : stats.nextDueDays < 0
                          ? `Overdue by ${Math.abs(stats.nextDueDays)} Day${Math.abs(stats.nextDueDays) !== 1 ? 's' : ''}`
                          : `${Math.abs(stats.nextDueHours)} Hour${Math.abs(stats.nextDueHours) !== 1 ? 's' : ''} Overdue`
                    }
                  </span>
                </div>
              </div>
              {/* Progress indicators */}
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
              {(stats.nextDueDays <= 0) && (
                <button
                  onClick={handleLogDoseNow}
                  className="mt-2 w-full py-2 px-4 rounded-lg bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white font-semibold text-sm shadow-[0_0_20px_rgba(74,222,168,0.5)] hover:shadow-[0_0_30px_rgba(74,222,168,0.7)] transition-all duration-300 hover:scale-[1.02]"
                >
                  {isLogging ? 'Logging...' : (stats.nextDueDays < 0 ? 'Log Overdue Dose' : 'Log Dose Now')}
                </button>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-2 sm:gap-3 overflow-visible">
            <div className={smallCard}>
              <p className={text.label}>Total Doses</p>
              <p className={text.value}>{stats.totalDoses}</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Next Due</p>
              <p className={text.totalLossValue} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>{stats.nextDueDays > 0 ? `${stats.nextDueDays} Day${stats.nextDueDays > 1 ? 's' : ''}` : 'Today'}</span>
                <span className={text.percentage}>{stats.nextDueDateStr}</span>
              </p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Current Dose</p>
              <p className={text.value}>{stats.totalCurrentDose.toFixed(2)}mg</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Current Level</p>
              <p className={text.value}>{stats.currentLevel.toFixed(2)}mg</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Planned Doses</p>
              <p className={text.value}>{stats.plannedDoses}</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Logged Doses</p>
              <p className={text.value}>{stats.thisMonth}</p>
            </div>
          </div>
          
          <div className="border-t border-[#B19CD9]/20 my-3"></div>

          <div>
            <PeriodSelector value={chartPeriod} onChange={onChartPeriodChange} />
            <div className="h-64 sm:h-80">
              <MedicationChart key={medicationEntries.length} data={medicationEntries} period={chartPeriod} />
            </div>
          </div>
        </div>

        <div className="border-t border-[#B19CD9]/20 my-3"></div>

        <Button onClick={() => setIsModalOpen(true)} fullWidth>
          + Log Dose Manually
        </Button>
      </div>

      {/* Protocol Card */}
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Dosing Plans</h1>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        {/* Saved Protocols List - Grouped by Medication */}
        {protocols.length > 0 && (
          <div className="space-y-3 mb-4">
            {Object.entries(
              protocols.reduce((acc, protocol) => {
                const med = MEDICATIONS.find(m => m.id === protocol.medication);
                const medName = med?.name || protocol.medication;
                if (!acc[medName]) {
                  acc[medName] = [];
                }
                acc[medName].push(protocol);
                return acc;
              }, {} as Record<string, GLP1Protocol[]>)
            ).map(([medicationName, medProtocols]) => {
              const isExpanded = !collapsedMedications.has(medicationName);
              return (
              <div 
                key={medicationName}
                className="bg-black/20 rounded-lg p-3 border border-[#B19CD9]/20"
              >
                <button 
                  onClick={() => toggleMedication(medicationName)}
                  className="w-full flex items-center justify-between mb-2"
                >
                  <div className="text-left">
                    <p className="text-base font-medium text-text-primary">{medicationName}</p>
                    <p className="text-sm text-text-muted">{formatFrequency(medProtocols[0].frequencyPerWeek)}</p>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isExpanded && (
                <div className="space-y-1">
                  {medProtocols.map((protocol, index) => (
                    <div key={protocol.id}>
                      <div className="flex items-start justify-between gap-2 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary whitespace-nowrap">
                            {protocol.dose}mg
                          </span>
                          {protocol.phase === 'titrate' && (
                            <span className="text-[#4ADEA8]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-muted whitespace-nowrap">
                            {formatDateShort(protocol.startDate)} → {protocol.stopDate ? formatDateShort(protocol.stopDate) : 'Ongoing'}
                          </span>
                          <button
                            onClick={() => handleEditProtocol(protocol)}
                            className="text-sm text-accent-purple-light hover:text-accent-purple-medium"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                      {index < medProtocols.length - 1 && (
                        <div className="border-b border-[#B19CD9]/20"></div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setDeleteConfirmMed(medicationName)}
                    className="mt-2 px-2 py-1 text-xs text-red-400 hover:text-red-500 border border-red-500/30 rounded hover:bg-red-500/10 transition-all"
                  >
                    Delete
                  </button>
                </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-[#B19CD9]/20 my-3"></div>

        <div className="flex gap-2">
          <Button 
            onClick={() => {
              setProtocolModalMode('add');
              setEditingProtocol(null);
              setIsProtocolModalOpen(true);
            }} 
            fullWidth
            variant="accent"
          >
            + Custom Plan
          </Button>

          <Button 
            onClick={() => {
              const acknowledged = localStorage.getItem('glpal_disclaimer_acknowledged');
              if (acknowledged === 'true') {
                setShowOfficialScheduleModal(true);
              } else {
                setShowDisclaimer(true);
              }
            }} 
            fullWidth
            variant="accent"
          >
            + Schedule
          </Button>
        </div>
      </div>

      <ProtocolModal
        isOpen={isProtocolModalOpen}
        onClose={() => setIsProtocolModalOpen(false)}
        onSave={handleSaveProtocol}
        onArchive={handleArchiveProtocol}
        onDelete={handleDeleteProtocol}
        protocol={editingProtocol}
        mode={protocolModalMode}
        existingProtocols={protocols}
      />

      {showOfficialScheduleModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div 
            className="fixed inset-0 bg-black/60" 
            style={{ backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }} 
            onClick={() => setShowOfficialScheduleModal(false)} 
          />
          <div 
            className="relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-sm p-6"
            style={{ animation: 'slideUp 0.2s ease-out' }}
          >
            <h2 className="text-xl font-semibold text-white mb-6">Add Schedule</h2>
            <div className="border-t border-[#B19CD9]/20 mb-3"></div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#B19CD9] mb-2">Medication</label>
                <div className="grid grid-cols-1 gap-2">
                  {MEDICATIONS.filter(m => m.titrationDoses && m.titrationDoses.length > 0 && ['semaglutide', 'tirzepatide', 'retatrutide', 'cagrilintide'].includes(m.id)).map(med => (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => setOfficialScheduleMedication(med.id)}
                      className={`text-left px-3 py-2 rounded-lg transition-all text-sm text-white ${
                        officialScheduleMedication === med.id
                          ? 'bg-[#B19CD9]/30 border border-[#B19CD9]'
                          : 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10'
                      }`}
                    >
                      {med.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B19CD9] mb-2">Split Dosing</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOfficialScheduleSplitDosing(false)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      !officialScheduleSplitDosing
                        ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white'
                        : 'bg-black/20 text-[#B19CD9] border border-[#B19CD9]/30'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfficialScheduleSplitDosing(true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      officialScheduleSplitDosing
                        ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white'
                        : 'bg-black/20 text-[#B19CD9] border border-[#B19CD9]/30'
                    }`}
                  >
                    Yes
                  </button>
                </div>
                {officialScheduleSplitDosing && (
                  <p className="text-xs text-[#4ADEA8] mt-1">Dose will be split in half and taken every 3.5 days</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B19CD9] mb-2">Start Date</label>
                <button
                  type="button"
                  onClick={() => setShowOfficialScheduleDatePicker(true)}
                  className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm text-left"
                >
                  {new Date(officialScheduleStartDate).toLocaleDateString()}
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowOfficialScheduleModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const med = MEDICATIONS.find(m => m.id === officialScheduleMedication);
                    if (!med?.titrationDoses || med.titrationDoses.length === 0) return;
                    
                    const titrationDoses = med.titrationDoses;
                    const daysPerDose = 28;
                    const freqValue = officialScheduleSplitDosing ? 2 : 1;

                    const titrationProtocols: GLP1Protocol[] = titrationDoses.map((titrationDose, index) => {
                      const phaseStart = new Date(new Date(officialScheduleStartDate).getTime() + index * daysPerDose * 24 * 60 * 60 * 1000);
                      const phaseEnd = new Date(new Date(officialScheduleStartDate).getTime() + (index + 1) * daysPerDose * 24 * 60 * 60 * 1000 - 1);

                      return {
                        id: generateId(),
                        medication: med.name,
                        dose: officialScheduleSplitDosing ? titrationDose / 2 : titrationDose,
                        frequencyPerWeek: freqValue,
                        startDate: phaseStart.toISOString().split('T')[0],
                        stopDate: phaseEnd.toISOString().split('T')[0],
                        halfLifeHours: med.halfLifeHours,
                        phase: 'titrate' as const,
                      };
                    });

                    const updatedProtocols = [...protocols, ...titrationProtocols];
                    saveMedicationProtocols(updatedProtocols);
                    setProtocols(updatedProtocols);
                    handleGenerateDoses(updatedProtocols);
                    onRefreshMedications();
                    setShowOfficialScheduleModal(false);
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-medium hover:shadow-[0_0_20px_rgba(177,156,217,0.5)] transition-all"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DateWheelPickerModal
        isOpen={showOfficialScheduleDatePicker}
        value={officialScheduleStartDate}
        onChange={(date) => {
          setOfficialScheduleStartDate(date);
          setShowOfficialScheduleDatePicker(false);
        }}
        onClose={() => setShowOfficialScheduleDatePicker(false)}
      />

      <MedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddMedication={onAddMedication}
      />

      <LogDoseModal
        isOpen={showLogDoseModal}
        onClose={() => {
          setShowLogDoseModal(false);
          setIsLogging(false);
        }}
        onSave={() => {
          onRefreshMedications();
          onLogDose();
          setIsLogging(false);
        }}
        protocol={activeProtocolForModal}
      />

      {deleteConfirmMed && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div 
            className="fixed inset-0 bg-black/60" 
            style={{ backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }} 
            onClick={() => setDeleteConfirmMed(null)} 
          />
          <div 
            className="relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-red-500/30 w-full max-w-sm p-6"
            style={{ animation: 'slideUp 0.2s ease-out' }}
          >
            <h2 className="text-xl font-semibold text-white mb-2">Delete {deleteConfirmMed}?</h2>
            <p className="text-sm text-text-muted mb-6">This will remove all protocols for this medication. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmMed(null)}
                className="flex-1 py-3 rounded-xl border border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMedication(deleteConfirmMed)}
                className="flex-1 py-3 rounded-xl bg-red-500/80 text-white font-medium hover:bg-red-500 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisclaimer && (
        <div 
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
          style={{ 
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div 
            className="fixed inset-0 bg-black/60" 
            style={{ backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }} 
            onClick={() => { setShowDisclaimer(false); setDisclaimerAcknowledged(false); }} 
          />
          <div 
            className="relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-sm p-6"
            style={{ animation: 'slideUp 0.2s ease-out' }}
          >
            <h2 className="text-xl font-semibold text-white mb-4">Disclaimer</h2>
            <p className="text-sm text-text-muted mb-4 leading-relaxed">
              This app is for informational and tracking purposes only. Medication schedules shown are based on publicly available prescribing information and are not medical advice.
            </p>
            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              By continuing, you confirm that the selected schedule was prescribed by your licensed healthcare provider. This app does not prescribe, recommend, or adjust medication doses. Always consult your healthcare provider before starting, stopping, or changing any medication.
            </p>
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={disclaimerAcknowledged}
                  onChange={(e) => setDisclaimerAcknowledged(e.target.checked)}
                  className="peer w-5 h-5 appearance-none rounded border border-[#B19CD9]/50 bg-black/30 checked:bg-[#B19CD9] checked:border-[#B19CD9] cursor-pointer transition-all"
                />
                <svg
                  className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-[#4ADEA8]">I understand and agree to the above</span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDisclaimer(false); setDisclaimerAcknowledged(false); }}
                className="flex-1 py-3 rounded-xl border border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('glpal_disclaimer_acknowledged', 'true');
                  setShowDisclaimer(false);
                  setDisclaimerAcknowledged(false);
                  setShowOfficialScheduleModal(true);
                }}
                disabled={!disclaimerAcknowledged}
                className={`flex-1 py-3 rounded-xl bg-gradient-to-r font-medium transition-all ${
                  disclaimerAcknowledged
                    ? 'from-[#B19CD9] to-[#9C7BD3] text-white hover:shadow-[0_0_20px_rgba(177,156,217,0.5)]'
                    : 'from-[#B19CD9]/50 to-[#9C7BD3]/50 text-white/50 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationTab;
