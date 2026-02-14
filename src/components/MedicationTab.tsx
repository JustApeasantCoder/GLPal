import React, { useState, useMemo, useEffect } from 'react';
import MedicationChart from './MedicationChart';
import MedicationModal from './MedicationModal';
import PeriodSelector from './PeriodSelector';
import ProtocolModal from './ProtocolModal';
import Button from './ui/Button';
import { GLP1Entry, GLP1Protocol } from '../types';
import { ChartPeriod } from '../hooks';
import { useThemeStyles } from '../contexts/ThemeContext';
import { calculateMedicationConcentration } from '../utils/calculations';
import { addMedicationGeneratedEntry, clearMedicationEntries } from '../utils/database';
import { MEDICATIONS, formatDate, formatFrequency } from '../constants/medications';
import { generateDosesFromProtocols, saveProtocol, deleteProtocol, archiveProtocol, getActiveProtocols } from '../services/MedicationService';

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
  const { bigCard, bigCardText, smallCard, text } = useThemeStyles();

  useEffect(() => {
    const savedProtocols = getActiveProtocols();
    setProtocols(savedProtocols);
  }, []);

  const handleGenerateDoses = (protocolList: GLP1Protocol[]) => {
    clearMedicationEntries();
    const generatedDoses = generateDosesFromProtocols(protocolList, []);
    generatedDoses.forEach(entry => addMedicationGeneratedEntry(entry));
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
    
    const sortedAsc = [...medicationEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const nextDose = sortedAsc.find(d => {
      const doseDate = new Date(d.date + 'T00:00:00');
      doseDate.setHours(0, 0, 0, 0);
      return doseDate >= today;
    });
    
    let nextDueDays = 0;
    let nextDueDateStr = 'N/A';
    if (nextDose) {
      const nextDoseDate = new Date(nextDose.date);
      nextDoseDate.setHours(0, 0, 0, 0);
      nextDueDays = Math.ceil((nextDoseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      nextDueDateStr = nextDoseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    const sorted = [...medicationEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

    return { totalDoses, currentDoses, totalCurrentDose, nextDueDays, nextDueDateStr, currentLevel, thisMonth, plannedDoses };
  }, [medicationEntries]);

  return (
    <div className="space-y-3">
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Doses</h1>
        <div className="border-t border-[#B19CD9]/20 mb-4"></div>
        
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
              <p className={text.label}>This Month</p>
              <p className={text.value}>{stats.thisMonth}</p>
            </div>
          </div>
          
          <div className="border-t border-[#B19CD9]/20 my-4"></div>

          <div>
            <PeriodSelector value={chartPeriod} onChange={onChartPeriodChange} />
            <div className="h-64 sm:h-80">
              <MedicationChart key={medicationEntries.length} data={medicationEntries} period={chartPeriod} />
            </div>
          </div>
        </div>

        <div className="border-t border-[#B19CD9]/20 my-4"></div>

        <Button onClick={() => setIsModalOpen(true)} fullWidth>
          + Log Dose
        </Button>
      </div>

      {/* Protocol Card */}
      <div className={bigCard}>
        <div className="flex justify-between items-center mb-4">
          <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Protocol</h1>
          {protocols.length > 0 && (
            <button
              onClick={handleRegenerate}
              className="text-xs text-accent-purple-light hover:text-accent-purple-medium"
            >
              Regenerate
            </button>
          )}
        </div>
        <div className="border-t border-[#B19CD9]/20 mb-4"></div>
        
        {/* Saved Protocols List */}
        {protocols.length > 0 && (
          <div className="space-y-2 mb-4">
            {protocols.map((protocol) => {
              const med = MEDICATIONS.find(m => m.id === protocol.medication);
              return (
                <div 
                  key={protocol.id}
                  className="flex items-center justify-between bg-black/20 rounded-lg p-3 border border-[#B19CD9]/20"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {med?.name || protocol.medication} - {protocol.dose}mg
                      {protocol.phase === 'titrate' && (
                        <span className="ml-2 text-xs text-[#4ADEA8] font-medium">Titrate</span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDate(protocol.startDate)} → {protocol.stopDate ? formatDate(protocol.stopDate) : 'Ongoing'} ({formatFrequency(protocol.frequencyPerWeek)})
                    </p>
                  </div>
                  <button
                    onClick={() => handleEditProtocol(protocol)}
                    className="text-xs text-accent-purple-light hover:text-accent-purple-medium"
                  >
                    Edit
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-[#B19CD9]/20 my-4"></div>

        <Button 
          onClick={() => {
            setProtocolModalMode('add');
            setEditingProtocol(null);
            setIsProtocolModalOpen(true);
          }} 
          fullWidth
        >
          + Add Protocol
        </Button>
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

      <MedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddMedication={onAddMedication}
      />
    </div>
  );
};

export default MedicationTab;
