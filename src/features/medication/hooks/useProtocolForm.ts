import { useState, useEffect, useMemo } from 'react';
import { GLP1Protocol } from '../../../types';
import { MEDICATIONS, generateId, Medication } from '../../../constants/medications';
import { timeService } from '../../../core/timeService';

const getTodayString = () => timeService.todayString();

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface UseProtocolFormOptions {
  isOpen: boolean;
  mode: 'add' | 'edit';
  protocol?: GLP1Protocol | null;
  existingProtocols?: GLP1Protocol[];
}

export interface UseProtocolFormReturn {
  selectedMedication: string;
  setSelectedMedication: (id: string) => void;
  dose: string;
  setDose: (value: string) => void;
  frequency: string;
  setFrequency: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  stopDate: string;
  setStopDate: (value: string) => void;
  continuationInfo: string | null;
  setContinuationInfo: (info: string | null) => void;
  phase: 'titrate' | 'maintenance' | undefined;
  setPhase: (phase: 'titrate' | 'maintenance' | undefined) => void;
  selectedDurationDays: number;
  setSelectedDurationDays: (days: number) => void;
  customMedication: string;
  setCustomMedication: (value: string) => void;
  savedMedications: string[];
  showOtherModal: boolean;
  setShowOtherModal: (show: boolean) => void;
  MAIN_MEDICATIONS: Medication[];
  getAllMedicationIds: () => string[];
  applyMedicationDefaults: (medicationId: string) => void;
  handleSave: () => GLP1Protocol | null;
  resetForm: () => void;
}

export const useProtocolForm = ({
  isOpen,
  mode,
  protocol,
  existingProtocols,
}: UseProtocolFormOptions): UseProtocolFormReturn => {
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [dose, setDose] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('1');
  const [startDate, setStartDate] = useState<string>(getTodayString());
  const [stopDate, setStopDate] = useState<string>('');
  const [continuationInfo, setContinuationInfo] = useState<string | null>(null);
  const [phase, setPhase] = useState<'titrate' | 'maintenance' | undefined>(undefined);
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
            let newStartDate = getTodayString();
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
                newStartDate = toLocalDateString(lastEndDate);
                continuation = `Continues from ${medData.name} protocol (ended ${lastProtocol.stopDate})`;
                
                const endDate = new Date(newStartDate);
                endDate.setDate(endDate.getDate() + durationDays);
                setStopDate(toLocalDateString(endDate));
              } else {
                continuation = `Continues from ${medData.name} protocol (ongoing)`;
                const endDate = new Date(newStartDate);
                endDate.setDate(endDate.getDate() + durationDays);
                setStopDate(toLocalDateString(endDate));
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
            const today = getTodayString();
            setStartDate(today);
            const defaultEndDate = new Date(new Date(today).getTime() + durationDays * 24 * 60 * 60 * 1000);
            setStopDate(toLocalDateString(defaultEndDate));
            setContinuationInfo(null);
            setPhase(undefined);
          }
        } else {
          setSelectedMedication('');
          setDose('');
          setFrequency('1');
          const today = getTodayString();
          setStartDate(today);
          const defaultEndDate = new Date(new Date(today).getTime() + durationDays * 24 * 60 * 60 * 1000);
          setStopDate(toLocalDateString(defaultEndDate));
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
    
    const otherMeds = savedMedications.filter(name => 
      !['Semaglutide (Ozempic/Wegovy)', 'Tirzepatide (Mounjaro/Zepbound)', 'Retatrutide'].includes(name)
    );
    
    const otherIds = otherMeds.map(name => {
      const med = MEDICATIONS.find(m => m.name === name);
      return med ? med.id : null;
    }).filter(Boolean) as string[];
    
    return [...mainIds, 'other', ...otherIds];
  };

  const MAIN_MEDICATIONS = useMemo(() => {
    return MEDICATIONS.filter(m => {
      return getAllMedicationIds().includes(m.id);
    }).map(med => {
      if (med.id === 'other') {
        return { ...med, name: 'More Options' };
      }
      return med;
    });
  }, [savedMedications]);

  useEffect(() => {
    localStorage.setItem('protocolDurationDays', selectedDurationDays.toString());
  }, [selectedDurationDays]);

  const applyMedicationDefaults = (medicationId: string) => {
    const med = MEDICATIONS.find(m => m.id === medicationId);
    if (!med) return;

    let newDose = med.defaultDose.toString();
    let newStartDate = getTodayString();
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
          newStartDate = toLocalDateString(lastEndDate);
          setContinuationInfo(`Continues from ${med.name} protocol (ended ${lastProtocol.stopDate})`);
          
          const endDate = new Date(newStartDate);
          endDate.setDate(endDate.getDate() + selectedDurationDays);
          setStopDate(toLocalDateString(endDate));
        } else {
          newStartDate = getTodayString();
          setContinuationInfo(`Continues from ${med.name} protocol (ongoing)`);
          
          const endDate = new Date(newStartDate);
          endDate.setDate(endDate.getDate() + selectedDurationDays);
          setStopDate(toLocalDateString(endDate));
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

  const handleSave = (): GLP1Protocol | null => {
    const med = MEDICATIONS.find(m => m.id === selectedMedication);
    
    if (!dose || !frequency || !startDate) return null;
    
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
      return null;
    }

    const stopDateValue = stopDate 
      ? stopDate 
      : toLocalDateString(new Date(new Date(startDate).getTime() + 365 * 24 * 60 * 60 * 1000));

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

    return newProtocol;
  };

  const resetForm = () => {
    setSelectedMedication('');
    setDose('');
    setFrequency('1');
    setStartDate(getTodayString());
    setStopDate('');
    setContinuationInfo(null);
    setPhase(undefined);
    setShowOtherModal(false);
    setCustomMedication('');
  };

  return {
    selectedMedication,
    setSelectedMedication,
    dose,
    setDose,
    frequency,
    setFrequency,
    startDate,
    setStartDate,
    stopDate,
    setStopDate,
    continuationInfo,
    setContinuationInfo,
    phase,
    setPhase,
    selectedDurationDays,
    setSelectedDurationDays,
    customMedication,
    setCustomMedication,
    savedMedications,
    showOtherModal,
    setShowOtherModal,
    MAIN_MEDICATIONS,
    getAllMedicationIds,
    applyMedicationDefaults,
    handleSave,
    resetForm,
  };
};

export const frequencyOptions = [
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

export const durationPresets = [
  { label: '1W', days: 7 },
  { label: '2W', days: 14 },
  { label: '1M', days: 28 },
  { label: '1Y', days: 336 },
];

export { toLocalDateString, getTodayString };
