import React, { useState, useEffect } from 'react';
import { GLP1Protocol } from '../../../types';
import { MEDICATIONS, SEMAGLUTIDE_TITRATION, generateId, Medication } from '../../../constants/medications';
import DateWheelPickerModal from '../../../shared/components/DateWheelPickerModal';
import DoseWheelPickerModal from '../../../shared/components/DoseWheelPickerModal';
import BottomSheetModal from '../../../shared/components/BottomSheetModal';

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
  const [phase, setPhase] = useState<'titrate' | 'maintenance' | undefined>(undefined);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);
  const [selectedDurationDays, setSelectedDurationDays] = useState<number>(() => {
    const saved = localStorage.getItem('protocolDurationDays');
    return saved ? parseInt(saved, 10) : 28;
  });
const [showOtherModal, setShowOtherModal] = useState(false);
  const [customMedication, setCustomMedication] = useState('');
  const [savedMedications, setSavedMedications] = useState<string[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStopDatePicker, setShowStopDatePicker] = useState(false);
  const [showDosePicker, setShowDosePicker] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  const frequencyOptions = [
    { value: '7', label: 'Everyday' },
    { value: '3.5', label: 'Every 2 Days' },
    { value: '2.333', label: 'Every 3 Days' },
    { value: '2', label: 'Every 3.5 Days' },
    { value: '1.75', label: 'Every 4 Days' },
    { value: '1.4', label: 'Every 5 Days' },
    { value: '1.167', label: 'Every 6 Days' },
    { value: '1', label: 'Every Week' },
    { value: '0.5', label: 'Every 2 Weeks' },
    { value: '0.333', label: 'Every 3 Weeks' },
    { value: '0.233', label: 'Every Month' },
  ];

  useEffect(() => {
    const loadMedications = () => {
      const mainMeds = ['Semaglutide (Ozempic/Wegovy)', 'Tirzepatide (Mounjaro/Zepbound)', 'Retatrutide'];
      
      if (existingProtocols && existingProtocols.length > 0) {
        const usedMedNames = Array.from(new Set(existingProtocols.map(p => p.medication)));
        const filteredMeds = usedMedNames.filter(m => mainMeds.includes(m) || m !== 'Semaglutide (Ozempic/Wegovy)' && m !== 'Tirzepatide (Mounjaro/Zepbound)' && m !== 'Retatrutide' && m !== 'More Options');
        setSavedMedications(filteredMeds);
        localStorage.setItem('usedMedications', JSON.stringify(filteredMeds));
        return filteredMeds;
      } else {
        const saved = localStorage.getItem('usedMedications');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSavedMedications(parsed);
          return parsed;
        } else {
          setSavedMedications([]);
          return [];
        }
      }
    };

    if (isOpen) {
      const loadedMeds = loadMedications();
      
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
        setPhase(protocol.phase);
        setShowOtherModal(false);
        setCustomMedication('');
      } else if (mode === 'add') {
        const savedDuration = localStorage.getItem('protocolDurationDays');
        const durationDays = savedDuration ? parseInt(savedDuration, 10) : 28;
        
        if (loadedMeds && loadedMeds.length > 0) {
          const lastMedName = loadedMeds[loadedMeds.length - 1];
          const med = MEDICATIONS.find(m => m.name === lastMedName);
          if (med) {
            const medId = med.id;
            const medData = med;
            
            let newDose = medData.defaultDose.toString();
            let newStartDate = new Date().toISOString().split('T')[0];
            let continuation: string | null = null;
            let isTitration = false;
            
            const medProtocols = (existingProtocols || [])
              .filter(p => p.medication === medData.name || p.medication === medId);
            
            if (medProtocols.length > 0) {
              const sortedProtocols = [...medProtocols].sort((a, b) => {
                if (!a.stopDate) return 1;
                if (!b.stopDate) return -1;
                return new Date(b.stopDate).getTime() - new Date(a.stopDate).getTime();
              });
              
              const lastProtocol = sortedProtocols[0];
              
              if (lastProtocol.stopDate) {
                const lastEndDate = new Date(lastProtocol.stopDate);
                newStartDate = lastEndDate.toISOString().split('T')[0];
                continuation = `Continues from ${medData.name} protocol (ended ${lastProtocol.stopDate})`;
                
                const endDate = new Date(newStartDate);
                endDate.setDate(endDate.getDate() + durationDays);
                setStopDate(endDate.toISOString().split('T')[0]);
              } else {
                continuation = `Continues from ${medData.name} protocol (ongoing)`;
                const endDate = new Date(newStartDate);
                endDate.setDate(endDate.getDate() + durationDays);
                setStopDate(endDate.toISOString().split('T')[0]);
              }

              if (medData.titrationDoses) {
                const lastDoseIndex = medData.titrationDoses.indexOf(lastProtocol.dose);
                if (lastDoseIndex >= 0 && lastDoseIndex < medData.titrationDoses.length - 1) {
                  newDose = medData.titrationDoses[lastDoseIndex + 1].toString();
                  isTitration = true;
                }
              }
            }
            
            setSelectedMedication(medId);
            setStartDate(newStartDate);
            setDose(newDose);
            setContinuationInfo(continuation);
            setPhase(isTitration ? 'titrate' : undefined);
            setFrequency('1');
          } else {
            setSelectedMedication('');
            setDose('');
            setFrequency('1');
            const today = new Date().toISOString().split('T')[0];
            setStartDate(today);
            const defaultEndDate = new Date(new Date(today).getTime() + durationDays * 24 * 60 * 60 * 1000);
            setStopDate(defaultEndDate.toISOString().split('T')[0]);
            setContinuationInfo(null);
            setPhase(undefined);
          }
        } else {
          setSelectedMedication('');
          setDose('');
          setFrequency('1');
          const today = new Date().toISOString().split('T')[0];
          setStartDate(today);
          const defaultEndDate = new Date(new Date(today).getTime() + durationDays * 24 * 60 * 60 * 1000);
          setStopDate(defaultEndDate.toISOString().split('T')[0]);
          setContinuationInfo(null);
          setPhase(undefined);
        }
        setShowOtherModal(false);
        setCustomMedication('');
      }
    }
  }, [isOpen, mode, protocol, existingProtocols]);

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

  const applyMedicationDefaults = (medicationId: string) => {
    const med = MEDICATIONS.find(m => m.id === medicationId);
    if (!med) return;

    let newDose = med.defaultDose.toString();
    let newStartDate = new Date().toISOString().split('T')[0];
    let isTitration = false;

    if (mode === 'add' && existingProtocols) {
      const medName = med.name;
      const medProtocols = existingProtocols
        .filter(p => p.medication === medName || p.medication === medicationId);
      
      if (medProtocols.length > 0) {
        const sortedProtocols = [...medProtocols].sort((a, b) => {
          if (!a.stopDate) return 1;
          if (!b.stopDate) return -1;
          return new Date(b.stopDate).getTime() - new Date(a.stopDate).getTime();
        });
        
        const lastProtocol = sortedProtocols[0];
        
        if (lastProtocol.stopDate) {
          const lastEndDate = new Date(lastProtocol.stopDate);
          newStartDate = lastEndDate.toISOString().split('T')[0];
          setContinuationInfo(`Continues from ${med.name} protocol (ended ${lastProtocol.stopDate})`);
          
          const endDate = new Date(newStartDate);
          endDate.setDate(endDate.getDate() + selectedDurationDays);
          setStopDate(endDate.toISOString().split('T')[0]);
        } else {
          newStartDate = new Date().toISOString().split('T')[0];
          setContinuationInfo(`Continues from ${med.name} protocol (ongoing)`);
          
          const endDate = new Date(newStartDate);
          endDate.setDate(endDate.getDate() + selectedDurationDays);
          setStopDate(endDate.toISOString().split('T')[0]);
        }

        if (med.titrationDoses) {
          const lastDoseIndex = med.titrationDoses.indexOf(lastProtocol.dose);
          if (lastDoseIndex >= 0 && lastDoseIndex < med.titrationDoses.length - 1) {
            newDose = med.titrationDoses[lastDoseIndex + 1].toString();
            isTitration = true;
          }
        }
      } else {
        setContinuationInfo(null);
      }
    }

    setSelectedMedication(medicationId);
    setStartDate(newStartDate);
    setDose(newDose);
    setPhase(isTitration ? 'titrate' : undefined);
  };

  const handleMedicationSelect = (medicationId: string) => {
    applyMedicationDefaults(medicationId);
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
      phase,
    };

    onSave(newProtocol);
    onClose();
  };

  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      document.body.classList.add('modal-open');
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
        document.body.classList.remove('modal-open');
      }, 200);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className={`fixed inset-0 bg-black/60 ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`} style={{ backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div className={`relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-sm p-6 ${isClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
        <h2 className="text-xl font-semibold text-white mb-6">
          {mode === 'add' ? 'Add Custom Plan' : 'Edit Protocol'}
        </h2>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>

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

          <div className="border-t border-[#B19CD9]/20 my-3"></div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#B19CD9] mb-2">Dose (mg)</label>
              <button
                type="button"
                onClick={() => setShowDosePicker(true)}
                className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm text-left"
              >
                {dose ? `${dose} mg` : 'Select dose'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B19CD9] mb-2">Dosing Schedule</label>
              <button
                type="button"
                onClick={() => setShowSchedulePicker(true)}
                className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm text-left"
              >
                {frequencyOptions.find(f => f.value === frequency)?.label || 'Select schedule'}
              </button>
            </div>
            <p className="col-span-2 text-xs text-[#4ADEA8] mt-1">Pre-filled with official label dose. Enter only the dose prescribed by your healthcare provider.</p>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-3"></div>

          <div>
            <label className="block text-sm font-medium text-[#B19CD9] mb-2">Start Date</label>
            <button
              type="button"
              onClick={() => setShowStartDatePicker(true)}
              className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm text-left"
            >
              {startDate ? new Date(startDate).toLocaleDateString() : 'Select date'}
            </button>
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
            <label className="block text-sm font-medium text-[#B19CD9] mb-2">End Date</label>
            <button
              type="button"
              onClick={() => setShowStopDatePicker(true)}
              className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm text-left"
            >
              {stopDate ? new Date(stopDate).toLocaleDateString() : 'Select date'}
            </button>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-3"></div>

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
            <div className={`fixed inset-0 bg-black/60 ${showOtherModal ? 'backdrop-fade-in' : 'backdrop-fade-out'}`} style={{ backdropFilter: 'blur(8px)' }} onClick={() => setShowOtherModal(false)} />
            <div className="relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-xs p-6 modal-content-fade-in">
              <h3 className="text-lg font-semibold text-white mb-4">Select Medication</h3>
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
            </div>
          </div>
        )}

        {showStartDatePicker && (
          <DateWheelPickerModal
            isOpen={showStartDatePicker}
            value={startDate}
            onChange={(date) => {
              setStartDate(date);
              setContinuationInfo(null);
              if (selectedDurationDays && date) {
                const endDate = new Date(new Date(date).getTime() + selectedDurationDays * 24 * 60 * 60 * 1000);
                setStopDate(endDate.toISOString().split('T')[0]);
              }
            }}
            onClose={() => setShowStartDatePicker(false)}
          />
        )}

        {showStopDatePicker && (
          <DateWheelPickerModal
            isOpen={showStopDatePicker}
            value={stopDate}
            onChange={(date) => {
              setStopDate(date);
            }}
            onClose={() => setShowStopDatePicker(false)}
          />
        )}

        {showDosePicker && (
          <DoseWheelPickerModal
            isOpen={showDosePicker}
            onSave={(value) => {
              setDose(value);
              setShowDosePicker(false);
            }}
            onClose={() => setShowDosePicker(false)}
            min={0}
            max={100}
            label="Select Dose (mg)"
            decimals={2}
            defaultValue={dose || '0.25'}
          />
        )}

        <BottomSheetModal
          isOpen={showSchedulePicker}
          title="Dosing Schedule"
          options={frequencyOptions}
          value={frequency}
          onSelect={(val) => {
            setFrequency(String(val));
            setShowSchedulePicker(false);
          }}
          onClose={() => setShowSchedulePicker(false)}
        />
    </div>
  );
};

export default ProtocolModal;
