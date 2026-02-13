import React, { useState, useMemo, useEffect } from 'react';
import DosesChart from './DosesChart';
import DoseModal from './DoseModal';
import PeriodSelector from './PeriodSelector';
import { GLP1Entry, GLP1Protocol } from '../types';
import { ChartPeriod } from '../hooks';
import { useThemeStyles } from '../contexts/ThemeContext';
import { calculateGLP1Concentration } from '../utils/calculations';
import { saveGLP1Protocols, getGLP1Protocols, deleteGLP1Protocol, getArchivedProtocols, setGLP1Entries, clearGLP1Entries } from '../utils/database';

interface DosesTabProps {
  dosesEntries: GLP1Entry[];
  onAddDose: (dose: number, medication: string, date: string) => void;
  onRefreshDoses: () => void;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (period: ChartPeriod) => void;
}

const MEDICATIONS = [
  { id: 'semaglutide', name: 'Semaglutide (Ozempic/Wegovy)', defaultDose: 2.4, halfLifeHours: 168 },
  { id: 'tirzepatide', name: 'Tirzepatide (Mounjaro/Zepbound)', defaultDose: 15, halfLifeHours: 127 },
  { id: 'retatrutide', name: 'Retatrutide', defaultDose: 12, halfLifeHours: 120 },
  { id: 'liraglutide', name: 'Liraglutide (Victoza/Saxenda)', defaultDose: 3, halfLifeHours: 13 },
  { id: 'dulaglutide', name: 'Dulaglutide (Trulicity)', defaultDose: 4.5, halfLifeHours: 108 },
  { id: 'other', name: 'Other', defaultDose: 1, halfLifeHours: 120 },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (protocol: GLP1Protocol) => void;
  onArchive?: (protocol: GLP1Protocol) => void;
  onDelete?: (id: string) => void;
  protocol?: GLP1Protocol | null;
  mode: 'add' | 'edit';
}

const ProtocolModal: React.FC<ProtocolModalProps> = ({ isOpen, onClose, onSave, onArchive, onDelete, protocol, mode }) => {
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [dose, setDose] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('1');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [stopDate, setStopDate] = useState<string>('');
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfirmAction(null);
      if (mode === 'edit' && protocol) {
        setSelectedMedication(protocol.medication);
        setDose(protocol.dose.toString());
        setFrequency(protocol.frequencyPerWeek.toString());
        setStartDate(protocol.startDate);
        setStopDate(protocol.stopDate || '');
      } else {
        setSelectedMedication('');
        setDose('');
        setFrequency('1');
        setStartDate(new Date().toISOString().split('T')[0]);
        setStopDate('');
      }
    }
  }, [isOpen, mode, protocol]);

  const handleSave = () => {
    const med = MEDICATIONS.find(m => m.id === selectedMedication);
    if (!med || !dose || !frequency || !startDate) return;

    const stopDateValue = stopDate 
      ? stopDate 
      : new Date(new Date(startDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newProtocol: GLP1Protocol = {
      id: protocol?.id || generateId(),
      medication: selectedMedication,
      dose: parseFloat(dose),
      frequencyPerWeek: parseInt(frequency),
      startDate,
      stopDate: stopDateValue,
      halfLifeHours: med.halfLifeHours,
    };

    onSave(newProtocol);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card-bg backdrop-blur-xl rounded-2xl shadow-theme-lg border border-card-border w-full max-w-sm p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {mode === 'add' ? 'Add Protocol' : 'Edit Protocol'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#B19CD9] mb-2">Medication</label>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {MEDICATIONS.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => {
                    setSelectedMedication(med.id);
                    setDose(med.defaultDose.toString());
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm text-white ${
                    selectedMedication === med.id
                      ? 'bg-[#B19CD9]/30 border border-[#B19CD9]'
                      : 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10'
                  }`}
                >
                  {med.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#B19CD9] mb-2">Dose (mg)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="99.9"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Enter dose"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B19CD9] mb-2">Per Week</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm"
              >
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="3">3x</option>
                <option value="4">4x</option>
                <option value="5">5x</option>
                <option value="6">6x</option>
                <option value="7">Daily</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#B19CD9] mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#B19CD9] mb-2">End Date (optional)</label>
            <input
              type="date"
              value={stopDate}
              onChange={(e) => setStopDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="flex gap-2">
            {mode === 'edit' && onDelete && onArchive && !confirmAction && (
              <>
                <button
                  onClick={() => setConfirmAction('archive')}
                  className="flex-1 px-4 py-2 rounded-lg border border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10 transition-all text-sm"
                >
                  Archive
                </button>
                <button
                  onClick={() => setConfirmAction('delete')}
                  className="flex-1 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm"
                >
                  Delete
                </button>
              </>
            )}
            {mode === 'edit' && confirmAction && (
              <>
                <button
                  onClick={() => {
                    if (protocol && confirmAction === 'archive' && onArchive) {
                      onArchive(protocol);
                    }
                    if (protocol && confirmAction === 'delete' && onDelete) {
                      onDelete(protocol.id);
                    }
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm"
                >
                  Yes, {confirmAction}
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10 transition-all text-sm"
                >
                  Cancel
                </button>
              </>
            )}
            {mode === 'add' && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10 transition-all text-sm"
              >
                Cancel
              </button>
            )}
            {!confirmAction && (
              <button
                onClick={handleSave}
                className={`${mode === 'edit' ? 'flex-1' : 'flex-1'} bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:shadow-theme transition-all text-sm`}
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DosesTab: React.FC<DosesTabProps> = ({ dosesEntries, onAddDose, onRefreshDoses, chartPeriod, onChartPeriodChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [protocols, setProtocols] = useState<GLP1Protocol[]>([]);
  const [editingProtocol, setEditingProtocol] = useState<GLP1Protocol | null>(null);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [protocolModalMode, setProtocolModalMode] = useState<'add' | 'edit'>('add');
  const { bigCard, bigCardText, smallCard, text } = useThemeStyles();

  useEffect(() => {
    const savedProtocols = getGLP1Protocols();
    const validProtocols = Array.isArray(savedProtocols) ? savedProtocols : [];
    setProtocols(validProtocols);
  }, []);

  const handleGenerateDoses = (protocolList: GLP1Protocol[]) => {
    const today = new Date();
    const generatedDoses: GLP1Entry[] = [];

    protocolList.forEach(prot => {
      if (prot.isArchived) return;
      
      const start = new Date(prot.startDate);
      const end = prot.stopDate ? new Date(prot.stopDate) : today;
      const intervalDays = 7 / prot.frequencyPerWeek;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + intervalDays)) {
        const dateStr = d.toISOString().split('T')[0];
        const existingEntry = dosesEntries.find(e => e.date === dateStr && e.medication === prot.medication);
        if (!existingEntry) {
          generatedDoses.push({
            date: dateStr,
            medication: prot.medication,
            dose: prot.dose,
            halfLifeHours: prot.halfLifeHours,
          });
        }
      }
    });

    generatedDoses.forEach(entry => onAddDose(entry.dose, entry.medication, entry.date));
  };

  const handleSaveProtocol = (protocol: GLP1Protocol) => {
    let updatedProtocols: GLP1Protocol[];
    
    if (protocolModalMode === 'add') {
      updatedProtocols = [...(Array.isArray(protocols) ? protocols : []), protocol];
    } else {
      updatedProtocols = (Array.isArray(protocols) ? protocols : []).map(p => 
        p.id === protocol.id ? protocol : p
      );
    }
    
    saveGLP1Protocols(updatedProtocols);
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
    deleteGLP1Protocol(id);
    const updatedList = (Array.isArray(protocols) ? protocols : []).filter(p => p.id !== id);
    saveGLP1Protocols(updatedList);
    
    // Clear and regenerate all doses from remaining protocols
    clearGLP1Entries();
    const newDoses: GLP1Entry[] = [];
    const today = new Date();
    
    updatedList.forEach(prot => {
      const start = new Date(prot.startDate);
      const end = prot.stopDate ? new Date(prot.stopDate) : today;
      const intervalDays = 7 / prot.frequencyPerWeek;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + intervalDays)) {
        const dateStr = d.toISOString().split('T')[0];
        newDoses.push({
          date: dateStr,
          medication: prot.medication,
          dose: prot.dose,
          halfLifeHours: prot.halfLifeHours,
        });
      }
    });
    
    // Sort by date and save
    newDoses.sort((a, b) => a.date.localeCompare(b.date));
    setGLP1Entries(newDoses);
    setProtocols(updatedList);
    setEditingProtocol(null);
    onRefreshDoses();
  };

  const handleArchiveProtocol = (protocol: GLP1Protocol) => {
    // Add to archived storage
    const archived = getArchivedProtocols();
    archived.push({ ...protocol, isArchived: true });
    localStorage.setItem('glp1_archived', JSON.stringify(archived));
    
    // Remove from active protocols
    const updatedList = (Array.isArray(protocols) ? protocols : []).filter(p => p.id !== protocol.id);
    saveGLP1Protocols(updatedList);
    
    // Clear and regenerate all doses from remaining protocols
    clearGLP1Entries();
    const newDoses: GLP1Entry[] = [];
    const today = new Date();
    
    updatedList.forEach(prot => {
      const start = new Date(prot.startDate);
      const end = prot.stopDate ? new Date(prot.stopDate) : today;
      const intervalDays = 7 / prot.frequencyPerWeek;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + intervalDays)) {
        const dateStr = d.toISOString().split('T')[0];
        newDoses.push({
          date: dateStr,
          medication: prot.medication,
          dose: prot.dose,
          halfLifeHours: prot.halfLifeHours,
        });
      }
    });
    
    // Sort by date and save
    newDoses.sort((a, b) => a.date.localeCompare(b.date));
    setGLP1Entries(newDoses);
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
            {protocols.map((protocol, index) => {
              const med = MEDICATIONS.find(m => m.id === protocol.medication);
              const isActive = protocol.stopDate === null;
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
