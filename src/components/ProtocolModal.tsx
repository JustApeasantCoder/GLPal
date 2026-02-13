import React, { useState, useEffect } from 'react';
import { GLP1Protocol } from '../types';
import { MEDICATIONS, SEMAGLUTIDE_TITRATION, generateId, Medication } from '../constants/medications';

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (protocol: GLP1Protocol) => void;
  onArchive?: (protocol: GLP1Protocol) => void;
  onDelete?: (id: string) => void;
  protocol?: GLP1Protocol | null;
  mode: 'add' | 'edit';
  existingProtocols?: GLP1Protocol[];
}

const ProtocolModal: React.FC<ProtocolModalProps> = ({ isOpen, onClose, onSave, onArchive, onDelete, protocol, mode, existingProtocols }) => {
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [dose, setDose] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('1');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [stopDate, setStopDate] = useState<string>('');
  const [continuationInfo, setContinuationInfo] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);
  const [selectedDurationDays, setSelectedDurationDays] = useState<number>(() => {
    const saved = localStorage.getItem('protocolDurationDays');
    return saved ? parseInt(saved, 10) : 28;
  });
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [customMedication, setCustomMedication] = useState('');
  const [savedMedications, setSavedMedications] = useState<string[]>([]);

  useEffect(() => {
    const loadMedications = () => {
      const mainMeds = ['Semaglutide (Ozempic/Wegovy)', 'Tirzepatide (Mounjaro/Zepbound)', 'Retatrutide'];
      
      if (existingProtocols && existingProtocols.length > 0) {
        const usedMedNames = Array.from(new Set(existingProtocols.map(p => p.medication)));
        const filteredMeds = usedMedNames.filter(m => mainMeds.includes(m) || m !== 'Semaglutide (Ozempic/Wegovy)' && m !== 'Tirzepatide (Mounjaro/Zepbound)' && m !== 'Retatrutide' && m !== 'More Options');
        setSavedMedications(filteredMeds);
        localStorage.setItem('usedMedications', JSON.stringify(filteredMeds));
      } else {
        const saved = localStorage.getItem('usedMedications');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSavedMedications(parsed);
        } else {
          setSavedMedications([]);
        }
      }
    };
    
    loadMedications();
  }, [isOpen, existingProtocols]);

  const getAllMedicationIds = () => {
    const mainIds = ['semaglutide', 'tirzepatide', 'retatrutide'];
    const predefinedNames = MEDICATIONS.filter(m => m.id !== 'other').map(m => m.name);
    
    const otherMeds = savedMedications.filter(name => 
      !['Semaglutide (Ozempic/Wegovy)', 'Tirzepatide (Mounjaro/Zepbound)', 'Retatrutide'].includes(name)
    );
    
    const otherIds = otherMeds.map(name => {
      const med = MEDICATIONS.find(m => m.name === name);
      return med ? med.id : null;
    }).filter(Boolean) as string[];
    
    return [...mainIds, 'other', ...otherIds];
  };

  const MAIN_MEDICATIONS = MEDICATIONS.filter(m => {
    return getAllMedicationIds().includes(m.id);
  }).map(med => {
    if (med.id === 'other') {
      return { ...med, name: 'More Options' };
    }
    return med;
  });

  useEffect(() => {
    localStorage.setItem('protocolDurationDays', selectedDurationDays.toString());
  }, [selectedDurationDays]);

  useEffect(() => {
    if (isOpen) {
      setConfirmAction(null);
      if (mode === 'edit' && protocol) {
        const med = MEDICATIONS.find(m => m.name === protocol.medication);
        if (med) {
          setSelectedMedication(med.id);
        } else {
          setSelectedMedication(protocol.medication);
        }
        setDose(protocol.dose.toString());
        setFrequency(protocol.frequencyPerWeek.toString());
        setStartDate(protocol.startDate);
        setStopDate(protocol.stopDate || '');
        setContinuationInfo(null);
        setShowOtherModal(false);
        setCustomMedication('');
      } else if (mode === 'add') {
        const savedDuration = localStorage.getItem('protocolDurationDays');
        const durationDays = savedDuration ? parseInt(savedDuration, 10) : 28;
        setSelectedMedication('');
        setDose('');
        setFrequency('1');
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        const defaultEndDate = new Date(new Date(today).getTime() + durationDays * 24 * 60 * 60 * 1000);
        setStopDate(defaultEndDate.toISOString().split('T')[0]);
        setContinuationInfo(null);
        setShowOtherModal(false);
        setCustomMedication('');
      }
    }
  }, [isOpen, mode, protocol]);

  const handleMedicationSelect = (medicationId: string) => {
    setSelectedMedication(medicationId);
    const med = MEDICATIONS.find(m => m.id === medicationId);
    
    let newDose = med?.defaultDose.toString() || '1';
    let newStartDate = new Date().toISOString().split('T')[0];

    if (mode === 'add' && existingProtocols && med) {
      const medName = med.name;
      const medProtocols = existingProtocols
        .filter(p => p.medication === medName || p.medication === medicationId)
        .filter(p => p.stopDate !== null);
      
      if (medProtocols.length > 0) {
        const lastProtocol = medProtocols.reduce((latest, p) => {
          const pEnd = new Date(p.stopDate!);
          const lEnd = new Date(latest.stopDate!);
          return pEnd > lEnd ? p : latest;
        });
        
        if (lastProtocol.stopDate) {
          const lastEndDate = new Date(lastProtocol.stopDate);
          newStartDate = lastEndDate.toISOString().split('T')[0];
          setContinuationInfo(`Continues from ${med.name} protocol (ended ${lastProtocol.stopDate})`);
          
          const endDate = new Date(newStartDate);
          endDate.setDate(endDate.getDate() + selectedDurationDays);
          setStopDate(endDate.toISOString().split('T')[0]);
        }

        if (medicationId === 'semaglutide' && med.titrationDoses) {
          const lastDoseIndex = med.titrationDoses.indexOf(lastProtocol.dose);
          if (lastDoseIndex >= 0 && lastDoseIndex < med.titrationDoses.length - 1) {
            newDose = med.titrationDoses[lastDoseIndex + 1].toString();
          }
        }
      } else {
        setContinuationInfo(null);
      }
    }
    
    setStartDate(newStartDate);
    setDose(newDose);
  };

  const handleSave = () => {
    const med = MEDICATIONS.find(m => m.id === selectedMedication);
    
    if (!dose || !frequency || !startDate) return;
    
    let medicationName = selectedMedication;
    let halfLife = 120;
    
    if (selectedMedication.startsWith('custom:')) {
      medicationName = selectedMedication.replace('custom:', '');
      const currentSaved = JSON.parse(localStorage.getItem('usedMedications') || '[]');
      if (!currentSaved.includes(medicationName)) {
        const updated = [...currentSaved, medicationName];
        localStorage.setItem('usedMedications', JSON.stringify(updated));
        setSavedMedications(updated);
      }
    } else if (med) {
      medicationName = med.name;
      halfLife = med.halfLifeHours;
      const currentSaved = JSON.parse(localStorage.getItem('usedMedications') || '[]');
      if (!currentSaved.includes(med.name)) {
        const updated = [...currentSaved, med.name];
        localStorage.setItem('usedMedications', JSON.stringify(updated));
        setSavedMedications(updated);
      }
    } else {
      return;
    }

    const stopDateValue = stopDate 
      ? stopDate 
      : new Date(new Date(startDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newProtocol: GLP1Protocol = {
      id: protocol?.id || generateId(),
      medication: medicationName,
      dose: parseFloat(dose),
      frequencyPerWeek: parseInt(frequency),
      startDate,
      stopDate: stopDateValue,
      halfLifeHours: halfLife,
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
            <div className="grid grid-cols-2 gap-2">
              {MAIN_MEDICATIONS.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => {
                    if (med.id === 'other') {
                      setShowOtherModal(true);
                    } else {
                      handleMedicationSelect(med.id);
                    }
                  }}
                  className={`text-left px-3 py-2 rounded-lg transition-all text-sm text-white ${
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
              <label className="block text-sm font-medium text-[#B19CD9] mb-2">Dosing Schedule</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm"
              >
                <option value="7">Everyday</option>
                <option value="3.5">Every 2 Days</option>
                <option value="2.333">Every 3 Days</option>
                <option value="2">Every 3.5 Days</option>
                <option value="1.75">Every 4 Days</option>
                <option value="1.4">Every 5 Days</option>
                <option value="1.167">Every 6 Days</option>
                <option value="1">Every Week</option>
                <option value="0.5">Every 2 Weeks</option>
                <option value="0.333">Every 3 Weeks</option>
                <option value="0.233">Every Month</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#B19CD9] mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setContinuationInfo(null);
                if (selectedDurationDays && e.target.value) {
                  const endDate = new Date(new Date(e.target.value).getTime() + selectedDurationDays * 24 * 60 * 60 * 1000);
                  setStopDate(endDate.toISOString().split('T')[0]);
                }
              }}
              className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm"
              style={{ colorScheme: 'dark' }}
            />
            {continuationInfo && (
              <p className="text-xs text-[#4ADEA8] mt-1">{continuationInfo}</p>
            )}
            <div className="flex gap-2 mt-2">
              {[
                { label: '1W', days: 7 },
                { label: '2W', days: 14 },
                { label: '1M', days: 28 },
                { label: '1Y', days: 336 },
              ].map((preset) => {
                const isSelected = selectedDurationDays === preset.days;
                return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSelectedDurationDays(preset.days);
                    if (startDate) {
                      const endDate = new Date(new Date(startDate).getTime() + preset.days * 24 * 60 * 60 * 1000);
                      setStopDate(endDate.toISOString().split('T')[0]);
                    }
                  }}
                  className={`flex-1 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                      : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
                  }`}
                >
                  {preset.label}
                </button>
              )})}
            </div>
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

      {showOtherModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOtherModal(false)} />
          <div className="relative bg-card-bg backdrop-blur-xl rounded-2xl shadow-theme-lg border border-card-border w-full max-w-xs p-4">
            <h3 className="text-md font-semibold text-text-primary mb-4">Select Medication</h3>
            <div className="space-y-2 mb-4">
              {MEDICATIONS.filter(m => !getAllMedicationIds().includes(m.id) || m.id === 'other').map((med: Medication) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => {
                    handleMedicationSelect(med.id);
                    setShowOtherModal(false);
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
            <div className="border-t border-[#B19CD9]/20 pt-4">
              <label className="block text-sm font-medium text-[#B19CD9] mb-2">Or enter custom medication</label>
              <input
                type="text"
                value={customMedication}
                onChange={(e) => setCustomMedication(e.target.value)}
                placeholder="Custom medication name"
                className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm mb-2"
              />
              <button
                onClick={() => {
                  if (customMedication.trim()) {
                    setSelectedMedication('custom:' + customMedication.trim());
                    setDose('1');
                    setShowOtherModal(false);
                  }
                }}
                disabled={!customMedication.trim()}
                className="w-full bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:shadow-theme transition-all text-sm disabled:opacity-50"
              >
                Add Custom
              </button>
            </div>
            <button
              onClick={() => setShowOtherModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocolModal;
