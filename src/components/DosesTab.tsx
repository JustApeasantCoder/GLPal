import React, { useState, useMemo, useEffect } from 'react';
import DosesChart from './DosesChart';
import DoseModal from './DoseModal';
import PeriodSelector from './PeriodSelector';
import { GLP1Entry, GLP1Protocol } from '../types';
import { ChartPeriod } from '../hooks';
import { useThemeStyles } from '../contexts/ThemeContext';
import { calculateGLP1Concentration } from '../utils/calculations';
import { saveGLP1Protocols, getGLP1Protocols, deleteGLP1Protocol, updateGLP1Protocol } from '../utils/database';

interface DosesTabProps {
  dosesEntries: GLP1Entry[];
  onAddDose: (dose: number, medication: string, date: string) => void;
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

const DosesTab: React.FC<DosesTabProps> = ({ dosesEntries, onAddDose, chartPeriod, onChartPeriodChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [protocols, setProtocols] = useState<GLP1Protocol[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [dose, setDose] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('1');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [stopDate, setStopDate] = useState<string>('');
  const [editingProtocol, setEditingProtocol] = useState<GLP1Protocol | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { bigCard, bigCardText, smallCard, text } = useThemeStyles();

  useEffect(() => {
    const savedProtocols = getGLP1Protocols();
    const validProtocols = Array.isArray(savedProtocols) ? savedProtocols : [];
    setProtocols(validProtocols);
    if (validProtocols.length > 0) {
      const lastProtocol = validProtocols[validProtocols.length - 1];
      setSelectedMedication(lastProtocol.medication);
      setDose(lastProtocol.dose.toString());
      setFrequency(lastProtocol.frequencyPerWeek.toString());
      setStartDate(lastProtocol.startDate);
    }
  }, []);

  const handleGenerateDoses = (protocolList: GLP1Protocol[]) => {
    const today = new Date();
    const generatedDoses: GLP1Entry[] = [];

    protocolList.forEach(prot => {
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

  const handleSaveProtocol = () => {
    const med = MEDICATIONS.find(m => m.id === selectedMedication);
    if (!med || !dose || !frequency || !startDate) return;

    const newProtocol: GLP1Protocol = {
      id: generateId(),
      medication: selectedMedication,
      dose: parseFloat(dose),
      frequencyPerWeek: parseInt(frequency),
      startDate,
      stopDate: stopDate || null,
      halfLifeHours: med.halfLifeHours,
    };

    const currentProtocols = Array.isArray(protocols) ? protocols : [];
    const updatedProtocols = [...currentProtocols, newProtocol];
    saveGLP1Protocols(updatedProtocols);
    setProtocols(updatedProtocols);
    handleGenerateDoses(updatedProtocols);
    setIsAddingNew(false);
    setStopDate('');
  };

  const handleStopProtocol = (protocol: GLP1Protocol, stopDate: string) => {
    const updated = { ...protocol, stopDate };
    updateGLP1Protocol(updated);
    const currentProtocols = Array.isArray(protocols) ? protocols : [];
    const updatedList = currentProtocols.map(p => p.id === protocol.id ? updated : p);
    saveGLP1Protocols(updatedList);
    setProtocols(updatedList);
    setEditingProtocol(null);
  };

  const handleDeleteProtocol = (id: string) => {
    deleteGLP1Protocol(id);
    const currentProtocols = Array.isArray(protocols) ? protocols : [];
    const updatedList = currentProtocols.filter(p => p.id !== id);
    saveGLP1Protocols(updatedList);
    setProtocols(updatedList);
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
        
        {/* Stats and Chart Section */}
        <div className="space-y-3 mb-6">
          {/* Stats Cards */}
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
                  className="flex items-center justify-between bg-black/20 rounded-lg p-3 border border-accent-purple-light/20"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {med?.name || protocol.medication} - {protocol.dose}mg
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDate(protocol.startDate)} → {protocol.stopDate ? formatDate(protocol.stopDate) : 'Ongoing'} ({protocol.frequencyPerWeek}x/week)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!isActive && (
                      <button
                        onClick={() => handleDeleteProtocol(protocol.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    )}
                    {isActive && index === protocols.length - 1 && (
                      <button
                        onClick={() => setEditingProtocol(protocol)}
                        className="text-xs text-accent-purple-light hover:text-accent-purple-medium"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stop Protocol Modal */}
        {editingProtocol && (
          <div className="mb-4 p-3 bg-black/20 rounded-lg border border-accent-purple-light/20">
            <p className="text-sm text-text-secondary mb-2">Set stop date for this protocol:</p>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleStopProtocol(editingProtocol, e.target.value)}
              className="w-full px-3 py-2 border border-accent-purple-light/30 bg-black/20 text-text-primary rounded-lg text-sm mb-2"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        )}

        {/* Add New Protocol Form */}
        {isAddingNew ? (
          <div className="space-y-4">
            {/* Medication Selection */}
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

            {/* Dose and Frequency */}
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

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-[#B19CD9] mb-2">Start Date</label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* End Date (optional) */}
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
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setStopDate('');
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProtocol}
                className="flex-1 bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:shadow-theme transition-all text-sm"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingNew(true)}
            className="w-full bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:from-accent-purple-dark hover:to-accent-purple-medium transition-all duration-300 shadow-theme hover:shadow-theme-lg text-sm"
          >
            + Add Protocol
          </button>
        )}
      </div>

      <DoseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddDose={onAddDose}
      />
    </div>
  );
};

export default DosesTab;
