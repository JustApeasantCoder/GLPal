import React, { useState, useEffect } from 'react';
import MedicationChart from './components/MedicationChart';
import MedicationModal from './components/MedicationModal';
import PeriodSelector from '../../shared/components/PeriodSelector';
import ProtocolModal from './components/ProtocolModal';
import Button from '../../shared/components/Button';
import DoseProgressBar from './components/DoseProgressBar';
import DoseStatsGrid from './components/DoseStatsGrid';
import ProtocolList from './components/ProtocolList';
import ScheduleModal from './components/ScheduleModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import DisclaimerModal from './components/DisclaimerModal';
import { useDoseStats } from './hooks/useDoseStats';
import { GLP1Entry, GLP1Protocol } from '../../types';
import { ChartPeriod } from '../weight/hooks/useFilteredWeights';
import { useTime } from '../../shared/hooks';
import { useThemeStyles } from '../../contexts/ThemeContext';
import { addMedicationGeneratedEntry, addMedicationManualEntry, clearMedicationEntries, deleteMedicationProtocol, saveMedicationProtocols, getMedicationManualEntries } from '../../shared/utils/database';
import { timeService } from '../../core/timeService';
import { MEDICATIONS, generateId } from '../../constants/medications';
import { generateDosesFromProtocols, saveProtocol, deleteProtocol, archiveProtocol, getActiveProtocols } from '../../services/MedicationService';

interface MedicationTabProps {
  medicationEntries: GLP1Entry[];
  onAddMedication: (dose: number, medication: string, date: string) => void;
  onRefreshMedications: () => void;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (period: ChartPeriod) => void;
}

const MedicationTab: React.FC<MedicationTabProps> = ({ medicationEntries, onAddMedication, onRefreshMedications, chartPeriod, onChartPeriodChange }) => {
  const [protocols, setProtocols] = useState<GLP1Protocol[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<GLP1Protocol | null>(null);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [protocolModalMode, setProtocolModalMode] = useState<'add' | 'edit'>('add');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [deleteConfirmMed, setDeleteConfirmMed] = useState<string | null>(null);
  const [collapsedMedications, setCollapsedMedications] = useState<Set<string>>(new Set());
  const { bigCard, bigCardText } = useThemeStyles();
  const now = useTime(100);

  const stats = useDoseStats(medicationEntries, protocols);

  useEffect(() => {
    const savedProtocols = getActiveProtocols();
    setProtocols(savedProtocols);
  }, []);

  const handleGenerateDoses = (protocolList: GLP1Protocol[]) => {
    // Clear only generated entries, keep manual entries
    clearMedicationEntries();
    
    const nowDate = new Date(now);
    nowDate.setHours(0, 0, 0, 0);
    
    // Generate doses from protocols (these are the planned/auto-generated doses)
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

  const handleLogDoseNow = () => {
    const now = new Date(timeService.now());
    now.setHours(0, 0, 0, 0);
    
    // Find the most recent protocol (either active or the latest one that ended recently)
    const activeProtocol = protocols?.find(p => {
      if (p.isArchived) return false;
      const start = new Date(p.startDate);
      const end = p.stopDate ? new Date(p.stopDate) : new Date('2099-12-31');
      return now >= start && now <= end;
    });

    // If no active protocol, find the most recent non-archived protocol
    let targetProtocol = activeProtocol;
    if (!targetProtocol) {
      const nonArchivedProtocols = protocols?.filter(p => !p.isArchived) || [];
      if (nonArchivedProtocols.length > 0) {
        // Sort by start date descending to get the most recent
        nonArchivedProtocols.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        targetProtocol = nonArchivedProtocols[0];
      }
    }

    if (targetProtocol) {
      const today = now.toISOString().split('T')[0];
      const newEntry: GLP1Entry = {
        date: today,
        medication: targetProtocol.medication,
        dose: targetProtocol.dose,
        halfLifeHours: targetProtocol.halfLifeHours,
        isManual: true
      };
      addMedicationManualEntry(newEntry);
      onRefreshMedications();
    } else {
      setIsModalOpen(true);
    }
  };

  const handleScheduleSave = (newProtocols: GLP1Protocol[]) => {
    const updatedProtocols = [...protocols, ...newProtocols];
    saveMedicationProtocols(updatedProtocols);
    setProtocols(updatedProtocols);
    handleGenerateDoses(updatedProtocols);
    onRefreshMedications();
  };

  const handleOpenSchedule = () => {
    const acknowledged = localStorage.getItem('glpal_disclaimer_acknowledged');
    if (acknowledged === 'true') {
      setShowScheduleModal(true);
    } else {
      setShowDisclaimer(true);
    }
  };

  return (
    <div className="space-y-3">
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Doses</h1>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        <div className="space-y-3 mb-6">
          <DoseProgressBar stats={stats} onLogDoseNow={handleLogDoseNow} />
          <DoseStatsGrid stats={stats} />
          
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

      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Dosing Plans</h1>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        <ProtocolList 
          protocols={protocols}
          collapsedMedications={collapsedMedications}
          onToggleMedication={toggleMedication}
          onEditProtocol={handleEditProtocol}
          onDeleteConfirm={setDeleteConfirmMed}
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
            onClick={handleOpenSchedule}
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

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={handleScheduleSave}
      />

      <MedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddMedication={onAddMedication}
      />

      <DeleteConfirmModal
        isOpen={!!deleteConfirmMed}
        medicationName={deleteConfirmMed || ''}
        onConfirm={() => deleteConfirmMed && handleDeleteMedication(deleteConfirmMed)}
        onCancel={() => setDeleteConfirmMed(null)}
      />

      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        onAccept={() => {
          setShowDisclaimer(false);
          setShowScheduleModal(true);
        }}
      />
    </div>
  );
};

export default MedicationTab;
