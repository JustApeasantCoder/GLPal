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
import { MEDICATIONS, formatDateShort, formatFrequency } from '../constants/medications';
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
  const [expandedMedications, setExpandedMedications] = useState<Set<string>>(() => {
    const savedProtocols = getActiveProtocols();
    if (savedProtocols.length === 0) return new Set();
    return new Set(savedProtocols.map(p => {
      const med = MEDICATIONS.find(m => m.id === p.medication);
      return med?.name || p.medication;
    }));
  });
  const { bigCard, bigCardText, smallCard, text } = useThemeStyles();

  useEffect(() => {
    const savedProtocols = getActiveProtocols();
    setProtocols(savedProtocols);
    if (savedProtocols.length > 0) {
      const medNames = new Set(savedProtocols.map(p => {
        const med = MEDICATIONS.find(m => m.id === p.medication);
        return med?.name || p.medication;
      }));
      setExpandedMedications(medNames);
    }
  }, []);

  const handleGenerateDoses = (protocolList: GLP1Protocol[]) => {
    clearMedicationEntries();
    const generatedDoses = generateDosesFromProtocols(protocolList, []);
    generatedDoses.forEach(entry => addMedicationGeneratedEntry(entry));
  };

  const toggleMedication = (medicationName: string) => {
    setExpandedMedications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(medicationName)) {
        newSet.delete(medicationName);
      } else {
        newSet.add(medicationName);
      }
      return newSet;
    });
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
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Protocol</h1>
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
              const isExpanded = expandedMedications.size === 0 || expandedMedications.has(medicationName);
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
                </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-[#B19CD9]/20 my-3"></div>

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
