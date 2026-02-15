import { useState, useEffect, useCallback } from 'react';
import { GLP1Protocol } from '../../../types';
import { MEDICATIONS } from '../../../constants/medications';
import {
  ProtocolFormState,
  getTodayString,
  calculateStopDate,
  getDefaultDurationDays,
  saveDurationDays,
  getSavedMedications,
  saveMedication,
  getAllMedicationIds,
  filterMainMedications,
  getLastProtocolForMed,
  getNextTitrationDose,
  createProtocolFromState,
  frequencyOptions,
} from './protocolUtils';

interface UseProtocolFormProps {
  protocol?: GLP1Protocol | null;
  mode: 'add' | 'edit';
  existingProtocols?: GLP1Protocol[];
}

export const useProtocolForm = ({
  protocol,
  mode,
  existingProtocols = [],
}: UseProtocolFormProps) => {
  const [formState, setFormState] = useState<ProtocolFormState>({
    selectedMedication: '',
    dose: '',
    frequency: '1',
    startDate: getTodayString(),
    stopDate: '',
    continuationInfo: null,
    phase: undefined,
  });

  const [savedMedications, setSavedMedications] = useState<string[]>([]);
  const [selectedDurationDays, setSelectedDurationDays] = useState<number>(
    getDefaultDurationDays()
  );
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [customMedication, setCustomMedication] = useState('');

  const allMedicationIds = getAllMedicationIds(savedMedications);
  const mainMedications = filterMainMedications(allMedicationIds);

  useEffect(() => {
    const loadMedications = () => {
      const mainMeds = [
        'Semaglutide (Ozempic/Wegovy)',
        'Tirzepatide (Mounjaro/Zepbound)',
        'Retatrutide',
      ];

      if (existingProtocols && existingProtocols.length > 0) {
        const usedMedNames = Array.from(
          new Set(existingProtocols.map((p) => p.medication))
        );
        const filteredMeds = usedMedNames.filter(
          (m) =>
            mainMeds.includes(m) ||
            (m !== 'Semaglutide (Ozempic/Wegovy)' &&
              m !== 'Tirzepatide (Mounjaro/Zepbound)' &&
              m !== 'Retatrutide' &&
              m !== 'More Options')
        );
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

    const loadedMeds = loadMedications();

    if (mode === 'edit' && protocol) {
      const med = MEDICATIONS.find((m) => m.name === protocol.medication);
      setFormState({
        selectedMedication: med ? med.id : protocol.medication,
        dose: protocol.dose.toString(),
        frequency: protocol.frequencyPerWeek.toString(),
        startDate: protocol.startDate,
        stopDate: protocol.stopDate || '',
        continuationInfo: null,
        phase: protocol.phase,
      });
    } else if (mode === 'add') {
      const durationDays = selectedDurationDays;

      if (loadedMeds && loadedMeds.length > 0) {
        const lastMedName = loadedMeds[loadedMeds.length - 1];
        const med = MEDICATIONS.find((m) => m.name === lastMedName);

        if (med) {
          let newDose = med.defaultDose.toString();
          let newStartDate = getTodayString();
          let continuation: string | null = null;
          let isTitration = false;

          const lastProtocolInfo = getLastProtocolForMed(
            med.id,
            existingProtocols
          );

          if (lastProtocolInfo) {
            if (lastProtocolInfo.lastEndDate) {
              newStartDate = lastProtocolInfo.lastEndDate;
              continuation = `Continues from ${med.name} protocol (ended ${lastProtocolInfo.lastEndDate})`;
              setFormState((prev) => ({
                ...prev,
                stopDate: calculateStopDate(newStartDate, durationDays),
              }));
            } else {
              continuation = `Continues from ${med.name} protocol (ongoing)`;
              setFormState((prev) => ({
                ...prev,
                stopDate: calculateStopDate(newStartDate, durationDays),
              }));
            }

            const nextDose = getNextTitrationDose(med.id, lastProtocolInfo.lastDose);
            if (nextDose) {
              newDose = nextDose.toString();
              isTitration = true;
            }
          }

          setFormState({
            selectedMedication: med.id,
            startDate: newStartDate,
            dose: newDose,
            continuationInfo: continuation,
            phase: isTitration ? 'titrate' : undefined,
            frequency: '1',
            stopDate: calculateStopDate(newStartDate, durationDays),
          });
        } else {
          resetForm(durationDays);
        }
      } else {
        resetForm(durationDays);
      }
    }
    setShowOtherModal(false);
    setCustomMedication('');
  }, [mode, protocol, existingProtocols]);

  const resetForm = (durationDays: number) => {
    const today = getTodayString();
    setFormState({
      selectedMedication: '',
      dose: '',
      frequency: '1',
      startDate: today,
      stopDate: calculateStopDate(today, durationDays),
      continuationInfo: null,
      phase: undefined,
    });
  };

  useEffect(() => {
    saveDurationDays(selectedDurationDays);
  }, [selectedDurationDays]);

  const applyMedicationDefaults = useCallback(
    (medicationId: string) => {
      const med = MEDICATIONS.find((m) => m.id === medicationId);
      if (!med) return;

      let newDose = med.defaultDose.toString();
      let newStartDate = getTodayString();
      let isTitration = false;

      if (mode === 'add' && existingProtocols) {
        const lastProtocolInfo = getLastProtocolForMed(medicationId, existingProtocols);

        if (lastProtocolInfo) {
          if (lastProtocolInfo.lastEndDate) {
            newStartDate = lastProtocolInfo.lastEndDate;
            setFormState((prev) => ({
              ...prev,
              continuationInfo: `Continues from ${med.name} protocol (ended ${lastProtocolInfo.lastEndDate})`,
              stopDate: calculateStopDate(newStartDate, selectedDurationDays),
            }));
          } else {
            setFormState((prev) => ({
              ...prev,
              continuationInfo: `Continues from ${med.name} protocol (ongoing)`,
              stopDate: calculateStopDate(newStartDate, selectedDurationDays),
            }));
          }

          const nextDose = getNextTitrationDose(med.id, lastProtocolInfo.lastDose);
          if (nextDose) {
            newDose = nextDose.toString();
            isTitration = true;
          }
        } else {
          setFormState((prev) => ({ ...prev, continuationInfo: null }));
        }
      }

      setFormState((prev) => ({
        ...prev,
        selectedMedication: medicationId,
        startDate: newStartDate,
        dose: newDose,
        phase: isTitration ? 'titrate' : undefined,
      }));
    },
    [mode, existingProtocols, selectedDurationDays]
  );

  const handleMedicationSelect = useCallback(
    (medicationId: string) => {
      applyMedicationDefaults(medicationId);
    },
    [applyMedicationDefaults]
  );

  const updateField = useCallback(
    <K extends keyof ProtocolFormState>(field: K, value: ProtocolFormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateDuration = useCallback(
    (days: number) => {
      setSelectedDurationDays(days);
      if (formState.startDate) {
        setFormState((prev) => ({
          ...prev,
          stopDate: calculateStopDate(prev.startDate, days),
        }));
      }
    },
    [formState.startDate]
  );

  const handleSave = useCallback((): GLP1Protocol | null => {
    if (!formState.dose || !formState.frequency || !formState.startDate) {
      return null;
    }

    if (formState.selectedMedication.startsWith('custom:')) {
      const medicationName = formState.selectedMedication.replace('custom:', '');
      saveMedication(medicationName);
    } else {
      const med = MEDICATIONS.find(
        (m) => m.id === formState.selectedMedication
      );
      if (med) {
        saveMedication(med.name);
      }
    }

    return createProtocolFromState(formState, protocol);
  }, [formState, protocol]);

  return {
    formState,
    savedMedications,
    selectedDurationDays,
    showOtherModal,
    customMedication,
    mainMedications,
    frequencyOptions,
    setShowOtherModal,
    setCustomMedication,
    setSelectedDurationDays: updateDuration,
    updateField,
    handleMedicationSelect,
    handleSave,
  };
};

export type { ProtocolFormState };
