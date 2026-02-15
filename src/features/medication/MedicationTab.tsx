import React, { useState, useMemo, useEffect } from 'react';
import MedicationChart from './components/MedicationChart';
import MedicationModal from './components/MedicationModal';
import PeriodSelector from '../../shared/components/PeriodSelector';
import ProtocolModal from './components/ProtocolModal';
import Button from '../../shared/components/Button';
import DateWheelPickerModal from '../../shared/components/DateWheelPickerModal';
import { GLP1Entry, GLP1Protocol } from '../../types';
import { ChartPeriod } from '../../shared/hooks';
import { useThemeStyles } from '../../contexts/ThemeContext';
import { calculateMedicationConcentration } from '../../shared/utils/calculations';
import { addMedicationGeneratedEntry, clearMedicationEntries, deleteMedicationProtocol, saveMedicationProtocols } from '../../shared/utils/database';
import { MEDICATIONS, formatDateShort, formatFrequency, generateId } from '../../constants/medications';
import { generateDosesFromProtocols, saveProtocol, deleteProtocol, archiveProtocol, getActiveProtocols } from '../../services/MedicationService';

interface MedicationTabProps {
  medicationEntries: GLP1Entry[];
  onAddMedication: (dose: number, medication: string, date: string) => void;
  onRefreshMedications: () => void;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (period: ChartPeriod) => void;
}

const MedicationTab: React.FC<MedicationTabProps> = ({ medicationEntries, onAddMedication, onRefreshMedications, chartPeriod, onChartPeriodChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pastDoses = medicationEntries.filter(e => {
      const doseDate = new Date(e.date + 'T00:00:00');
      doseDate.setHours(0, 0, 0, 0);
      return doseDate <= today;
    });
    
    const totalDoses = pastDoses.length;
    
    const currentDoses: { med: string; dose: number }[] = [];
    const meds = Array.from(new Set(medicationEntries.map(e => e.medication)));
    meds.forEach(med => {
      const sorted = [...medicationEntries]
        .filter(e => e.medication === med)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (sorted.length > 0) {
        currentDoses.push({ med: med, dose: sorted[0].dose });
      }
    });
    const totalCurrentDose = currentDoses.reduce((sum, d) => sum + d.dose, 0);
    
    const sorted = [...medicationEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sortedAsc = [...medicationEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const nextDose = sortedAsc.find(d => {
      const doseDate = new Date(d.date + 'T00:00:00');
      doseDate.setHours(0, 0, 0, 0);
      return doseDate >= today;
    });
    
    let nextDueDays = 0;
    let nextDueDateStr = 'N/A';
    let lastDoseDate: Date | null = null;
    let lastDoseDateStr = 'N/A';
    let daysSinceLastDose = 0;
    let intervalDays = 7; // default weekly
    
    if (sorted.length > 0) {
      lastDoseDate = new Date(sorted[0].date);
      lastDoseDate.setHours(0, 0, 0, 0);
      daysSinceLastDose = Math.floor((today.getTime() - lastDoseDate.getTime()) / (1000 * 60 * 60 * 24));
      lastDoseDateStr = lastDoseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Calculate interval from protocol frequency
      const firstEntry = sorted[0];
      const protocol = protocols.find(p => p.medication === firstEntry.medication);
      if (protocol) {
        intervalDays = Math.round(7 / protocol.frequencyPerWeek);
      }
    }
    
    if (nextDose && lastDoseDate) {
      const nextDoseDate = new Date(nextDose.date);
      nextDoseDate.setHours(0, 0, 0, 0);
      nextDueDays = Math.ceil((nextDoseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      nextDueDateStr = nextDoseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const calculatedInterval = Math.ceil((nextDoseDate.getTime() - lastDoseDate.getTime()) / (1000 * 60 * 60 * 24));
      if (calculatedInterval > 0) intervalDays = calculatedInterval;
    }
    
    const halfLife = sorted[0]?.halfLifeHours || 168;
    
    const medications = Array.from(new Set(sorted.map(e => e.medication)));
    let totalCurrentLevel = 0;
    
    medications.forEach(med => {
      const medEntries = sorted.filter(e => e.medication === med);
      const medHalfLife = medEntries[0]?.halfLifeHours || 168;
      const concentration = calculateMedicationConcentration(
        medEntries.map(e => ({ date: new Date(e.date), dose: e.dose })),
        medHalfLife,
        new Date()
      );
      totalCurrentLevel += concentration;
    });
    
    const currentLevel = totalCurrentLevel;
    
    const thisMonth = medicationEntries.filter(e => {
      const doseDate = new Date(e.date);
      return doseDate.getMonth() === today.getMonth() && doseDate.getFullYear() === today.getFullYear();
    }).length;
    
    const plannedDoses = medicationEntries.filter(e => {
      const doseDate = new Date(e.date + 'T00:00:00');
      doseDate.setHours(0, 0, 0, 0);
      return doseDate > today;
    }).length;

    return { totalDoses, currentDoses, totalCurrentDose, nextDueDays, nextDueDateStr, currentLevel, thisMonth, plannedDoses, lastDoseDateStr, daysSinceLastDose, intervalDays };
  }, [medicationEntries]);

  return (
    <div className="space-y-3">
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Doses</h1>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        <div className="space-y-3 mb-6">
          {/* Progress Bar - Next Dose Countdown */}
          {stats.lastDoseDateStr !== 'N/A' && (
            <div className="mb-4">
              <div className="relative overflow-hidden h-10 rounded-full bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border border-[#B19CD9]/30 shadow-[0_0_15px_rgba(177,156,217,0.3)]">
                {/* Progress Fill */}
                <div 
                  className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#B19CD9] via-[#D4B8E8] to-[#B19CD9] transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, Math.max(0, (stats.daysSinceLastDose / stats.intervalDays) * 100))}%`,
                    boxShadow: stats.nextDueDays <= 0 
                      ? '0 0 20px rgba(255,100,100,0.6)' 
                      : '0 0 15px rgba(177,156,217,0.6)'
                  }}
                />
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white drop-shadow-lg">
                    {stats.nextDueDays > 0 
                      ? `${stats.nextDueDays} Day${stats.nextDueDays > 1 ? 's' : ''} until next dose`
                      : stats.nextDueDays === 0 
                        ? 'Dose Due Today!'
                        : `Overdue by ${Math.abs(stats.nextDueDays)} Day${Math.abs(stats.nextDueDays) > 1 ? 's' : ''}`
                    }
                  </span>
                </div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-[#B19CD9]/70">
                <span>Last: {stats.lastDoseDateStr}</span>
                <span>Next: {stats.nextDueDateStr}</span>
              </div>
              {(stats.nextDueDays <= 0) && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 w-full py-2 px-4 rounded-lg bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-semibold text-sm shadow-[0_0_20px_rgba(177,156,217,0.5)] hover:shadow-[0_0_30px_rgba(177,156,217,0.7)] transition-all duration-300 hover:scale-[1.02]"
                >
                  {stats.nextDueDays < 0 ? 'Log Overdue Dose' : 'Log Dose Now'}
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
              <p className={text.label}>This Month</p>
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
          + Log Dose
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
