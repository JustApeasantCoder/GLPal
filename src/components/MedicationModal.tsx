import React, { useState, useEffect } from 'react';
import { MEDICATIONS } from '../constants/medications';
import { getLastDoses, saveLastDose, getLastMedication, saveLastMedication } from '../utils/database';
import DateWheelPickerModal from './ui/DateWheelPickerModal';
import DoseWheelPickerModal from './ui/DoseWheelPickerModal';

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMedication: (dose: number, medication: string, date: string) => void;
}

const MedicationModal: React.FC<MedicationModalProps> = ({ isOpen, onClose, onAddMedication }) => {
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [dose, setDose] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDosePicker, setShowDosePicker] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date().toISOString().split('T')[0]);
      const lastMed = getLastMedication();
      if (lastMed) {
        setSelectedMedication(lastMed);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedMedication) {
      const lastDoses = getLastDoses();
      if (lastDoses[selectedMedication]) {
        setDose(lastDoses[selectedMedication].toString());
      } else {
        const med = MEDICATIONS.find(m => m.id === selectedMedication);
        if (med) setDose(med.defaultDose.toString());
      }
    }
  }, [selectedMedication]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doseValue = parseFloat(dose);
    if (selectedMedication && doseValue && doseValue > 0 && doseValue < 100) {
      saveLastMedication(selectedMedication);
      saveLastDose(selectedMedication, doseValue);
      onAddMedication(doseValue, selectedMedication, selectedDate);
      setSelectedMedication('');
      setDose('');
      onClose();
    }
  };

  const handleMedicationSelect = (medId: string) => {
    setSelectedMedication(medId);
    const lastDoses = getLastDoses();
    if (lastDoses[medId]) {
      setDose(lastDoses[medId].toString());
    } else {
      const med = MEDICATIONS.find(m => m.id === medId);
      if (med) {
        setDose(med.defaultDose.toString());
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className={`fixed inset-0 bg-black/60 ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}
        style={{ backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <div className={`relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-sm p-6 ${isClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
        <h2 className="text-xl font-semibold text-white mb-6">Log Dose</h2>
        <div className="border-t border-[#B19CD9]/20 mb-6"></div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Date
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedDate}
                readOnly
                onClick={() => setShowDatePicker(true)}
                className="w-full px-3 py-2 pr-10 border border-[#B19CD9]/30 bg-black/20 text-text-primary rounded-lg cursor-pointer"
                placeholder="Select date"
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <DateWheelPickerModal
            isOpen={showDatePicker}
            value={selectedDate}
            onChange={setSelectedDate}
            onClose={() => setShowDatePicker(false)}
            maxDate={new Date().toISOString().split('T')[0]}
          />

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

          <div className="mb-4">
            <div className="border-t border-[#B19CD9]/20 my-4"></div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Medication
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {MEDICATIONS.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => handleMedicationSelect(med.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    selectedMedication === med.id
                      ? 'bg-[#B19CD9]/30 border border-[#B19CD9]'
                      : 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10'
                  }`}
                >
                  <span className="text-sm text-text-primary">{med.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="border-t border-[#B19CD9]/20 my-4"></div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Dose (mg)
            </label>
            <button
              type="button"
              onClick={() => setShowDosePicker(true)}
              className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-text-primary rounded-lg text-left"
            >
              {dose ? `${dose} mg` : 'Select dose'}
            </button>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-4"></div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-medium hover:shadow-[0_0_20px_rgba(177,156,217,0.5)] transition-all"
            >
              Log Dose
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicationModal;
