import React, { useState, useMemo, useEffect } from 'react';
import MedicationChart from './components/MedicationChart';
import MedicationModal from './components/MedicationModal';
import LogDoseModal from './components/LogDoseModal';
import PeriodSelector from '../../shared/components/PeriodSelector';
import ProtocolModal from './components/ProtocolModal';
import Button from '../../shared/components/Button';
import MedicationProgressBar from './components/MedicationProgressBar';
import MedicationProgressBarContainer from './components/MedicationProgressBarContainer';
import ProtocolList from './components/ProtocolList';
import DisclaimerModal from './components/DisclaimerModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import OverdueDisclaimerModal from './components/OverdueDisclaimerModal';
import OfficialScheduleModal from './components/OfficialScheduleModal';
import { GLP1Entry, GLP1Protocol } from '../../types';
import { ChartPeriod, useTime } from '../../shared/hooks';
import { useThemeStyles } from '../../contexts/ThemeContext';
import { addMedicationGeneratedEntry, addMedicationManualEntry, clearMedicationEntries, deleteMedicationProtocol, saveMedicationProtocols, getMedicationManualEntries } from '../../shared/utils/database';
import { MEDICATIONS, generateId } from '../../constants/medications';
import { generateDosesFromProtocols, saveProtocol, deleteProtocol, archiveProtocol, getActiveProtocols } from '../../services/MedicationService';
import { timeService } from '../../core/timeService';
import { useMedicationStats, useActiveProtocol, isMedicationOverdue } from './hooks/useMedicationStats';

interface MedicationTabProps {
  medicationEntries: GLP1Entry[];
  onAddMedication: (dose: number, medication: string, date: string) => void;
  onRefreshMedications: () => void;
  onLogDose: () => void;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (period: ChartPeriod) => void;
  useWheelForNumbers?: boolean;
  useWheelForDate?: boolean;
}

const MedicationTab: React.FC<MedicationTabProps> = ({ medicationEntries, onAddMedication, onRefreshMedications, onLogDose, chartPeriod, onChartPeriodChange, useWheelForNumbers = true, useWheelForDate = true }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogDoseModal, setShowLogDoseModal] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [activeProtocolForModal, setActiveProtocolForModal] = useState<GLP1Protocol | null>(null);
  const [protocols, setProtocols] = useState<GLP1Protocol[]>(() => getActiveProtocols());
  const [editingProtocol, setEditingProtocol] = useState<GLP1Protocol | null>(null);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [protocolModalMode, setProtocolModalMode] = useState<'add' | 'edit'>('add');
  const [showOfficialScheduleModal, setShowOfficialScheduleModal] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [deleteConfirmMed, setDeleteConfirmMed] = useState<string | null>(null);
  const [collapsedMedications, setCollapsedMedications] = useState<Set<string>>(new Set());

  const [showProgressDebug, setShowProgressDebug] = useState(false);
  const [showOverdueDisclaimer, setShowOverdueDisclaimer] = useState(false);
  const [loggingMedicationName, setLoggingMedicationName] = useState<string>('');
  const [latestDoseDone, setLatestDoseDone] = useState<number | null>(() => {
    const saved = localStorage.getItem('latestDoseDone');
    return saved ? parseInt(saved, 10) : null;
  });

  const nowTimestamp = useTime(100);
  const now = new Date(nowTimestamp);
  const activeProtocol = useActiveProtocol(protocols);
  const stats = useMedicationStats(medicationEntries, protocols, now, latestDoseDone);

  const uniqueMedications = useMemo(() => {
    const medSet = new Set<string>();
    protocols.forEach(p => {
      if (!p.isArchived) {
        medSet.add(p.medication);
      }
    });
    return Array.from(medSet);
  }, [protocols]);

  const { bigCard, bigCardText, smallCard, text } = useThemeStyles();

  const generatedEntries = useMemo(
    () => medicationEntries.filter(e => !e.isManual),
    [medicationEntries]
  );

  useEffect(() => {
    const saved = localStorage.getItem('latestDoseDone');
    if (saved) {
      setLatestDoseDone(parseInt(saved, 10));
    }
  }, [timeService.nowDate().getTime()]);

  const handleGenerateDoses = (protocolList: GLP1Protocol[]) => {
    clearMedicationEntries();
    const generatedDoses = generateDosesFromProtocols(protocolList, []);
    generatedDoses.forEach(entry => addMedicationGeneratedEntry(entry));
    
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
        
        const existingManual = getMedicationManualEntries();
        const alreadyLogged = existingManual.some(e => e.date === dateStr && e.medication === protocol.medication);
        
        if (!alreadyLogged) {
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

  const handleOfficialScheduleSave = (newProtocols: GLP1Protocol[]) => {
    const updatedProtocols = [...protocols, ...newProtocols];
    saveMedicationProtocols(updatedProtocols);
    setProtocols(updatedProtocols);
    handleGenerateDoses(updatedProtocols);
    onRefreshMedications();
    setShowOfficialScheduleModal(false);
  };

  const handleRegenerate = () => {
    if (protocols && protocols.length > 0) {
      handleGenerateDoses(protocols);
    }
  };

  const getActiveProtocolForMedication = (medicationName: string) => {
    return protocols.find(p => {
      if (p.isArchived || p.medication !== medicationName) return false;
      const start = p.startDate;
      const end = p.stopDate || '2099-12-31';
      const todayStr = timeService.todayString();
      return todayStr >= start && todayStr <= end;
    });
  };

  const handleLogDoseNow = (medicationName?: string) => {
    const targetMed = medicationName || activeProtocol?.medication;
    const targetProtocol = targetMed ? getActiveProtocolForMedication(targetMed) : activeProtocol;
    
    // Check overdue per medication
    const statsOverdue = targetMed ? isMedicationOverdue(medicationEntries, targetMed, now) : false;
    
    if (statsOverdue) {
      setLoggingMedicationName(targetMed || '');
      setShowOverdueDisclaimer(true);
      return;
    }
    
    const today = timeService.nowDate();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    if (targetProtocol) {
      setIsLogging(true);
      setActiveProtocolForModal(targetProtocol);
      setShowLogDoseModal(true);
    } else {
      setIsModalOpen(true);
    }
  };
  
  const handleConfirmOverdueDose = () => {
    setShowOverdueDisclaimer(false);
    const today = timeService.nowDate();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const targetMed = loggingMedicationName || activeProtocol?.medication;
    const targetProtocol = targetMed ? getActiveProtocolForMedication(targetMed) : activeProtocol;
    if (targetProtocol) {
      setIsLogging(true);
      setActiveProtocolForModal(targetProtocol);
      setShowLogDoseModal(true);
    } else {
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    const todayStr = timeService.todayString();
    const savedDate = localStorage.getItem('lastLoggedDate');
    const savedProtocolId = localStorage.getItem('lastLoggedProtocolId');
    
    const isNewDay = savedDate !== todayStr;
    const isNewProtocol = savedProtocolId !== (activeProtocol?.id || '');
    
    if (isNewDay) {
      localStorage.setItem('lastLoggedDate', todayStr);
    }
    if (isNewProtocol && activeProtocol) {
      localStorage.setItem('lastLoggedProtocolId', activeProtocol.id);
    }
  }, [now, activeProtocol?.id, medicationEntries]);

  const handleDisclaimerAcknowledged = () => {
    setShowDisclaimer(false);
    setShowOfficialScheduleModal(true);
  };

  const handleOpenOfficialSchedule = () => {
    const acknowledged = localStorage.getItem('glpal_disclaimer_acknowledged');
    if (acknowledged === 'true') {
      setShowOfficialScheduleModal(true);
    } else {
      setShowDisclaimer(true);
    }
  };

  const handleLogDoseSave = () => {
    const now = timeService.nowDate();
    setLatestDoseDone(now.getTime());
    localStorage.setItem('latestDoseDone', now.getTime().toString());
    onRefreshMedications();
    onLogDose();
    setIsLogging(false);
  };

  return (
    <div className="space-y-3">
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Doses</h1>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        <div className="space-y-3 mb-6">
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
          
          {uniqueMedications.map((medicationName, index) => (
            <div key={medicationName}>
              {index > 0 && <div className="border-t border-[#B19CD9]/20 my-3"></div>}
              <MedicationProgressBarContainer
                medicationEntries={medicationEntries}
                protocols={protocols}
                currentTime={now}
                latestDoseDone={latestDoseDone}
                medicationName={medicationName}
                onLogDose={() => handleLogDoseNow(medicationName)}
                isLogging={isLogging}
                allMedications={uniqueMedications}
              />
            </div>
          ))}
          
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => setShowProgressDebug(!showProgressDebug)}
              className="text-xs text-[#B19CD9]/50 hover:text-[#B19CD9] underline mb-2"
            >
              {showProgressDebug ? '▼ Hide' : '▶ Show'} Progress Bar Debug
            </button>
          )}
          
          {process.env.NODE_ENV === 'development' && showProgressDebug && (
            <ProgressDebugPanel 
              stats={stats} 
              now={now} 
              activeProtocol={activeProtocol} 
              medicationEntries={medicationEntries}
              doseLoggedToday={medicationEntries.some(e => e.date === timeService.todayString() && e.isManual)}
              protocols={protocols}
              uniqueMedications={uniqueMedications}
            />
          )}
          
          <div className="border-t border-[#B19CD9]/20 my-3"></div>

          <div>
            <PeriodSelector value={chartPeriod} onChange={onChartPeriodChange} />
            <div className="h-64 sm:h-80">
              <MedicationChart 
                data={generatedEntries} 
                period={chartPeriod} 
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#B19CD9]/20 my-3"></div>

        <Button onClick={() => setIsModalOpen(true)} fullWidth>
          + Log Dose Manually
        </Button>
      </div>

      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Dosing Plans</h1>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        <ProtocolList
          protocols={protocols}
          collapsedMedications={collapsedMedications}
          onToggleMedication={toggleMedication}
          onEditProtocol={handleEditProtocol}
          onDeleteClick={setDeleteConfirmMed}
        />

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
            onClick={handleOpenOfficialSchedule}
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
        useWheelForNumbers={useWheelForNumbers}
        useWheelForDate={useWheelForDate}
      />

      <OfficialScheduleModal
        isOpen={showOfficialScheduleModal}
        onClose={() => setShowOfficialScheduleModal(false)}
        onSave={handleOfficialScheduleSave}
        useWheelForDate={useWheelForDate}
      />

      <MedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddMedication={onAddMedication}
        useWheelForDate={useWheelForDate}
      />

      <LogDoseModal
        isOpen={showLogDoseModal}
        onClose={() => {
          setShowLogDoseModal(false);
          setIsLogging(false);
        }}
        onSave={handleLogDoseSave}
        protocol={activeProtocolForModal || activeProtocol || null}
        allMedications={uniqueMedications}
      />

      <OverdueDisclaimerModal
        isOpen={showOverdueDisclaimer}
        onClose={() => setShowOverdueDisclaimer(false)}
        onConfirm={handleConfirmOverdueDose}
      />

      <DeleteConfirmModal
        isOpen={!!deleteConfirmMed}
        medicationName={deleteConfirmMed || ''}
        onClose={() => setDeleteConfirmMed(null)}
        onConfirm={() => deleteConfirmMed && handleDeleteMedication(deleteConfirmMed)}
      />

      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        onAcknowledged={handleDisclaimerAcknowledged}
      />
    </div>
  );
};

interface ProgressDebugPanelProps {
  stats: ReturnType<typeof useMedicationStats>;
  now: Date;
  activeProtocol: GLP1Protocol | undefined;
  medicationEntries: GLP1Entry[];
  doseLoggedToday: boolean;
  protocols: GLP1Protocol[];
  uniqueMedications: string[];
}

const ProgressDebugPanel: React.FC<ProgressDebugPanelProps> = ({ stats, now, activeProtocol, medicationEntries, doseLoggedToday, protocols, uniqueMedications }) => {
  const todayStr = timeService.todayString();

  const getMedStats = (medName: string) => {
    const filteredEntries = medicationEntries.filter(e => e.medication === medName);
    const filteredProtocols = protocols.filter(p => p.medication === medName && !p.isArchived);
    return { filteredEntries, filteredProtocols };
  };

  return (
    <div className="mb-4 p-3 rounded-lg bg-black/40 border border-red-500/30 text-xs font-mono max-h-96 overflow-y-auto">
      <div className="text-red-400 font-bold mb-2">Progress Bar Debug Panel</div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-gray-400">now:</span>
        <span className="text-white">{now.toString()}</span>
        
        <span className="text-gray-400">Current Time:</span>
        <span className="text-white">{new Date(now).toLocaleTimeString()}</span>
        
        <span className="text-gray-400">todayStr:</span>
        <span className="text-yellow-400">{(() => {
          const ct = new Date(now);
          const y = ct.getFullYear();
          const m = String(ct.getMonth() + 1).padStart(2, '0');
          const d = String(ct.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        })()}</span>
      </div>
      
      <div className="border-t border-red-500/20 my-2"></div>
      <div className="text-red-300 mb-1">All Medications: {uniqueMedications.length}</div>
      <div className="grid grid-cols-1 gap-y-1 mb-2">
        {uniqueMedications.map(med => {
          const { filteredEntries, filteredProtocols } = getMedStats(med);
          const medHasEntryToday = filteredEntries.some(e => e.date === todayStr && e.isManual);
          const medHasProtocol = filteredProtocols.length > 0;
          const activeForMed = filteredProtocols.find(p => {
            const start = p.startDate;
            const end = p.stopDate || '2099-12-31';
            return todayStr >= start && todayStr <= end;
          });
          return (
            <div key={med} className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
              <span className="text-cyan-400">{med}:</span>
              <span className={medHasEntryToday ? 'text-green-400' : 'text-gray-400'}>
                {medHasEntryToday ? 'LOGGED' : 'not logged'} | 
                {medHasProtocol ? ` ${filteredProtocols.length} prot` : ' no prot'} |
                {activeForMed ? ` active: ${activeForMed.dose}mg` : ' no active'}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="border-t border-red-500/20 my-2"></div>
      <div className="text-red-300 mb-1">Active Protocol (Global):</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-gray-400">activeProtocol:</span>
        <span className="text-white">{activeProtocol ? 'EXISTS' : 'NULL'}</span>
        
        {activeProtocol && (
          <>
            <span className="text-gray-400">protocol.id:</span>
            <span className="text-cyan-400">{activeProtocol.id}</span>
            
            <span className="text-gray-400">protocol.medication:</span>
            <span className="text-white">{activeProtocol.medication}</span>
            
            <span className="text-gray-400">protocol.startDate:</span>
            <span className="text-yellow-400">{activeProtocol.startDate}</span>
            
            <span className="text-gray-400">protocol.stopDate:</span>
            <span className="text-yellow-400">{activeProtocol.stopDate || 'none'}</span>
            
            <span className="text-gray-400">protocol.frequencyPerWeek:</span>
            <span className="text-white">{activeProtocol.frequencyPerWeek}</span>
            
            <span className="text-gray-400">protocol.dose:</span>
            <span className="text-white">{activeProtocol.dose}mg</span>
            
            <span className="text-gray-400">protocol.halfLifeHours:</span>
            <span className="text-white">{activeProtocol.halfLifeHours}h</span>
          </>
        )}
      </div>
      
      <div className="border-t border-red-500/20 my-2"></div>
      <div className="text-red-300 mb-1">Stats Object (First Medication):</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-gray-400">totalDoses:</span>
        <span className="text-white">{stats.totalDoses}</span>
        
        <span className="text-gray-400">totalCurrentDose:</span>
        <span className="text-white">{stats.totalCurrentDose}mg</span>
        
        <span className="text-gray-400">thisMonth:</span>
        <span className="text-white">{stats.thisMonth}</span>
        
        <span className="text-gray-400">plannedDoses:</span>
        <span className="text-white">{stats.plannedDoses}</span>
        
        <span className="text-gray-400">intervalDays:</span>
        <span className="text-white">{stats.intervalDays}</span>
        
        <span className="text-gray-400">daysSinceLastDose:</span>
        <span className="text-white">{stats.daysSinceLastDose?.toFixed(2) || 'N/A'}</span>
        
        <span className="text-gray-400">lastDoseDateStr:</span>
        <span className="text-yellow-400">{stats.lastDoseDateStr}</span>
        
        <span className="text-gray-400">nextDueDateStr:</span>
        <span className="text-yellow-400">{stats.nextDueDateStr}</span>
        
        <span className="text-gray-400">latestDoseDone:</span>
        <span className="text-yellow-400">{stats.latestDoseDone ? stats.latestDoseDone + ' (' + new Date(stats.latestDoseDone).toLocaleDateString() + ')' : 'NULL'}</span>
      </div>
      
      <div className="border-t border-red-500/20 my-2"></div>
      <div className="text-red-300 mb-1">Time Until Next Dose:</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-gray-400">nextDueDays:</span>
        <span className="text-white">{stats.nextDueDays}</span>
        
        <span className="text-gray-400">nextDueHours:</span>
        <span className="text-white">{stats.nextDueHours}</span>
        
        <span className="text-gray-400">nextDueMinutes:</span>
        <span className="text-white">{stats.nextDueMinutes}</span>
        
        <span className="text-gray-400">nextDueSeconds:</span>
        <span className="text-white">{stats.nextDueSeconds}</span>
      </div>
      
      <div className="border-t border-red-500/20 my-2"></div>
      <div className="text-red-300 mb-1">Progress Bar Calculations:</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-gray-400">isScheduleStartDay:</span>
        <span className={stats.isScheduleStartDay ? 'text-green-400' : 'text-white'}>{stats.isScheduleStartDay ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">isDueToday:</span>
        <span className={stats.isDueToday ? 'text-green-400' : 'text-white'}>{stats.isDueToday ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">doseLoggedToday (global):</span>
        <span className={doseLoggedToday ? 'text-green-400' : 'text-white'}>{doseLoggedToday ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">hasEntryToday (any):</span>
        <span className={medicationEntries.some(e => e.date === todayStr) ? 'text-green-400' : 'text-white'}>{medicationEntries.some(e => e.date === todayStr) ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">hasManualEntryToday (any):</span>
        <span className={medicationEntries.some(e => e.date === todayStr && e.isManual) ? 'text-green-400' : 'text-white'}>{medicationEntries.some(e => e.date === todayStr && e.isManual) ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">lastLoggedDate:</span>
        <span className="text-yellow-400">{localStorage.getItem('lastLoggedDate') || 'NULL'}</span>
        
        <span className="text-gray-400">isOverdue (8+ days since last):</span>
        <span className={stats.isOverdue ? 'text-red-400' : 'text-white'}>{stats.isOverdue ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">semaglutideIsOverdue:</span>
        <span className={stats.semaglutideIsOverdue ? 'text-red-400' : 'text-white'}>{stats.semaglutideIsOverdue ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">tirzepatideIsOverdue:</span>
        <span className={stats.tirzepatideIsOverdue ? 'text-red-400' : 'text-white'}>{stats.tirzepatideIsOverdue ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">retatrutideIsOverdue:</span>
        <span className={stats.retatrutideIsOverdue ? 'text-red-400' : 'text-white'}>{stats.retatrutideIsOverdue ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">cagrilintideIsOverdue:</span>
        <span className={stats.cagrilintideIsOverdue ? 'text-red-400' : 'text-white'}>{stats.cagrilintideIsOverdue ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">semaglutideEntryToday:</span>
        <span className={stats.semaglutideEntryToday ? 'text-green-400' : 'text-white'}>{stats.semaglutideEntryToday ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">tirzepatideEntryToday:</span>
        <span className={stats.tirzepatideEntryToday ? 'text-green-400' : 'text-white'}>{stats.tirzepatideEntryToday ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">retatrutideEntryToday:</span>
        <span className={stats.retatrutideEntryToday ? 'text-green-400' : 'text-white'}>{stats.retatrutideEntryToday ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">cagrilintideEntryToday:</span>
        <span className={stats.cagrilintideEntryToday ? 'text-green-400' : 'text-white'}>{stats.cagrilintideEntryToday ? 'TRUE' : 'FALSE'}</span>
        
        <span className="text-gray-400">semaglutideDaysSinceLastDose:</span>
        <span className={stats.semaglutideDaysSinceLastDose >= 8 ? 'text-red-400' : 'text-yellow-400'}>{stats.semaglutideDaysSinceLastDose}</span>
        
        <span className="text-gray-400">tirzepatideDaysSinceLastDose:</span>
        <span className={stats.tirzepatideDaysSinceLastDose >= 8 ? 'text-red-400' : 'text-yellow-400'}>{stats.tirzepatideDaysSinceLastDose}</span>
        
        <span className="text-gray-400">retatrutideDaysSinceLastDose:</span>
        <span className={stats.retatrutideDaysSinceLastDose >= 8 ? 'text-red-400' : 'text-yellow-400'}>{stats.retatrutideDaysSinceLastDose}</span>
        
        <span className="text-gray-400">cagrilintideDaysSinceLastDose:</span>
        <span className={stats.cagrilintideDaysSinceLastDose >= 8 ? 'text-red-400' : 'text-yellow-400'}>{stats.cagrilintideDaysSinceLastDose}</span>
        
        <span className="text-gray-400">rawProgress (days/interval*100):</span>
        <span className="text-yellow-400">{stats.lastDoseDateStr === 'N/A' && !stats.isScheduleStartDay
          ? '0'
          : stats.lastDoseDateStr === 'N/A' && stats.isScheduleStartDay
            ? '0'
            : Math.min(80, Math.max(0, (stats.daysSinceLastDose / stats.intervalDays) * 100)).toFixed(2) + '%'}</span>
      </div>
      
      <div className="border-t border-red-500/20 my-2"></div>
      <div className="text-red-300 mb-1">Unique Meds in Entries:</div>
      <div className="text-yellow-400 text-xs mb-1">
        {Array.from(new Set(medicationEntries.map(e => e.medication))).join(', ')}
      </div>
      
      <div className="border-t border-red-500/20 my-2"></div>
      <div className="text-red-300 mb-1">Per-Med Status (Canonical Keys):</div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <span className="text-gray-400">semaglutide isOverdue:</span>
        <span className={stats.semaglutideIsOverdue ? 'text-red-400' : 'text-green-400'}>{stats.semaglutideIsOverdue ? 'TRUE' : 'FALSE'}</span>
        <span className="text-gray-400">tirzepatide isOverdue:</span>
        <span className={stats.tirzepatideIsOverdue ? 'text-red-400' : 'text-green-400'}>{stats.tirzepatideIsOverdue ? 'TRUE' : 'FALSE'}</span>
        <span className="text-gray-400">retatrutide isOverdue:</span>
        <span className={stats.retatrutideIsOverdue ? 'text-red-400' : 'text-green-400'}>{stats.retatrutideIsOverdue ? 'TRUE' : 'FALSE'}</span>
        <span className="text-gray-400">cagrilintide isOverdue:</span>
        <span className={stats.cagrilintideIsOverdue ? 'text-red-400' : 'text-green-400'}>{stats.cagrilintideIsOverdue ? 'TRUE' : 'FALSE'}</span>
      </div>
      
      <div className="text-red-300 mb-1">All Medication Entries ({medicationEntries.length} total):</div>
      <div className="grid grid-cols-1 gap-y-1 max-h-40 overflow-y-auto">
        {medicationEntries.slice(0, 20).map((entry, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-x-2 text-xs">
            <span className="text-yellow-400">{entry.date}</span>
            <span className="text-cyan-400">{entry.medication}</span>
            <span className={entry.isManual ? 'text-green-400' : 'text-gray-400'}>{entry.dose}mg {entry.isManual ? '(M)' : '(A)'}</span>
          </div>
        ))}
        {medicationEntries.length > 20 && (
          <span className="text-gray-400">...and {medicationEntries.length - 20} more</span>
        )}
      </div>
      
      <div className="border-t border-red-500/20 my-2"></div>
      <div className="text-red-300 mb-1">All Protocols ({protocols.length} total):</div>
      <div className="grid grid-cols-1 gap-y-1 max-h-40 overflow-y-auto">
        {protocols.map((p, idx) => {
          const isActive = todayStr >= p.startDate && todayStr <= (p.stopDate || '2099-12-31');
          return (
            <div key={idx} className="grid grid-cols-4 gap-x-1 text-xs">
              <span className={isActive ? 'text-green-400' : 'text-gray-400'}>{p.medication.substring(0, 8)}</span>
              <span className="text-yellow-400">{p.dose}mg</span>
              <span className="text-gray-400">{p.startDate}</span>
              <span className={p.isArchived ? 'text-red-400' : 'text-white'}>{p.isArchived ? 'archived' : 'active'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MedicationTab;
