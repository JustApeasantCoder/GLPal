import React, { useState, useMemo, useEffect } from 'react';
import DosesChart from './DosesChart';
import DoseModal from './DoseModal';
import PeriodSelector from './PeriodSelector';
import ProtocolModal from './ProtocolModal';
import { GLP1Entry, GLP1Protocol } from '../types';
import { ChartPeriod } from '../hooks';
import { useThemeStyles } from '../contexts/ThemeContext';
import { calculateGLP1Concentration } from '../utils/calculations';
import { addGLP1GeneratedEntry } from '../utils/database';
import { MEDICATIONS, formatDate } from '../constants/medications';
import { generateDosesFromProtocols, saveProtocol, deleteProtocol, archiveProtocol, getActiveProtocols } from '../services/GLP1Service';

interface DosesTabProps {
  dosesEntries: GLP1Entry[];
  onAddDose: (dose: number, medication: string, date: string) => void;
  onRefreshDoses: () => void;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (period: ChartPeriod) => void;
}

const DosesTab: React.FC<DosesTabProps> = ({ dosesEntries, onAddDose, onRefreshDoses, chartPeriod, onChartPeriodChange }) => {
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
    const generatedDoses = generateDosesFromProtocols(protocolList, []);
    generatedDoses.forEach(entry => addGLP1GeneratedEntry(entry));
  };

  const handleSaveProtocol = (protocol: GLP1Protocol) => {
    const updatedProtocols = saveProtocol(protocol, protocols);
    setProtocols(updatedProtocols);
    handleGenerateDoses(updatedProtocols);
    onRefreshDoses();
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
    onRefreshDoses();
  };

  const handleArchiveProtocol = (protocol: GLP1Protocol) => {
    const updatedList = archiveProtocol(protocol, protocols);
    setProtocols(updatedList);
    setEditingProtocol(null);
    onRefreshDoses();
  };

  const handleRegenerate = () => {
    if (protocols && protocols.length > 0) {
      handleGenerateDoses(protocols);
    }
  };

  const stats = useMemo(() => {
    if (dosesEntries.length === 0) {
      return { totalDoses: 0, currentDoses: [], totalCurrentDose: 0, nextDueDays: 0, nextDueDateStr: '', currentLevel: 0, timeActive: 0, thisMonth: 0 };
    }

    const sorted = [...dosesEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const oldest = [...dosesEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    
    const totalDoses = dosesEntries.length;
    
    const meds = Array.from(new Set(dosesEntries.map(e => e.medication)));
    const currentDoses: { med: string; dose: number }[] = [];
    meds.forEach(med => {
      const medDoses = sorted.filter(e => e.medication === med);
      if (medDoses.length > 0) {
        currentDoses.push({ med: med, dose: medDoses[0].dose });
      }
    });
    const totalCurrentDose = currentDoses.reduce((sum, d) => sum + d.dose, 0);
    
    const lastDoseDate = new Date(sorted[0]?.date);
    const today = new Date();
    const daysSinceLastDose = Math.floor((today.getTime() - lastDoseDate.getTime()) / (1000 * 60 * 60 * 24));
    const nextDueDays = Math.max(0, 7 - daysSinceLastDose);
    const nextDueDate = new Date(lastDoseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const getOrdinal = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const nextDueDateStr = `(${getOrdinal(nextDueDate.getDate())})`;
    
    const halfLife = sorted[0]?.halfLifeHours || 168;
    const currentLevel = calculateGLP1Concentration(
      sorted.map(e => ({ date: new Date(e.date), dose: e.dose })),
      halfLife,
      new Date()
    );
    
    const firstDoseDate = new Date(oldest.date);
    const timeActive = Math.floor((today.getTime() - firstDoseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const thisMonth = dosesEntries.filter(e => {
      const doseDate = new Date(e.date);
      return doseDate.getMonth() === today.getMonth() && doseDate.getFullYear() === today.getFullYear();
    }).length;

    return { totalDoses, currentDoses, totalCurrentDose, nextDueDays, nextDueDateStr, currentLevel, timeActive, thisMonth };
  }, [dosesEntries]);

  return (
    <div className="space-y-3">
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Doses</h1>
        
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 overflow-visible">
            <div className={smallCard}>
              <p className={text.label}>Total Doses</p>
              <p className={text.value}>{stats.totalDoses}</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Next Due</p>
              <p className={text.totalLossValue} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>{stats.nextDueDays} Day(s)</span>
                <span className={text.percentage}>{stats.nextDueDateStr}</span>
              </p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Current Dose</p>
              <p className={text.value}>{stats.totalCurrentDose.toFixed(2)}mg</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Current Level</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>Time Active</p>
            </div>
            <div className={smallCard}>
              <p className={text.label}>This Month</p>
            </div>
          </div>
          
          <div>
            <PeriodSelector value={chartPeriod} onChange={onChartPeriodChange} />
            <div className="h-64 sm:h-80">
              <DosesChart data={dosesEntries} period={chartPeriod} />
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-3 bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:from-accent-purple-dark hover:to-accent-purple-medium transition-all duration-300 shadow-theme hover:shadow-theme-lg"
        >
          Log Dose
        </button>
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
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDate(protocol.startDate)} → {protocol.stopDate ? formatDate(protocol.stopDate) : 'Ongoing'} ({protocol.frequencyPerWeek}x/week)
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

        <button
          onClick={() => {
            setProtocolModalMode('add');
            setEditingProtocol(null);
            setIsProtocolModalOpen(true);
          }}
          className="w-full bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:from-accent-purple-dark hover:to-accent-purple-medium transition-all duration-300 shadow-theme hover:shadow-theme-lg text-sm"
        >
          + Add Protocol
        </button>
      </div>

      <ProtocolModal
        isOpen={isProtocolModalOpen}
        onClose={() => setIsProtocolModalOpen(false)}
        onSave={handleSaveProtocol}
        onArchive={handleArchiveProtocol}
        onDelete={handleDeleteProtocol}
        protocol={editingProtocol}
        mode={protocolModalMode}
      />

      <DoseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddDose={onAddDose}
      />
    </div>
  );
};

export default DosesTab;
