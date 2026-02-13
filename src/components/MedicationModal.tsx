import React, { useState, useEffect } from 'react';
import { MEDICATIONS } from '../constants/medications';
import { getLastDoses, saveLastDose, getLastMedication, saveLastMedication } from '../utils/database';

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMedication: (dose: number, medication: string, date: string) => void;
}

const MedicationModal: React.FC<MedicationModalProps> = ({ isOpen, onClose, onAddMedication }) => {
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [dose, setDose] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

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

  if (!isOpen) return null;

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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card-bg backdrop-blur-xl rounded-2xl shadow-theme-lg border border-card-border w-full max-w-sm p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Log Dose</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-accent-purple-light/30 bg-black/20 text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium appearance-none"
                style={{ colorScheme: 'dark' }}
                required
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

          <div className="mb-4">
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
                      ? 'bg-accent-purple-light/30 border border-accent-purple-light'
                      : 'bg-black/20 border border-transparent hover:bg-accent-purple-light/10'
                  }`}
                >
                  <span className="text-sm text-text-primary">{med.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Dose (mg)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              max="99.9"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              className="w-full px-3 py-2 border border-accent-purple-light/30 bg-black/20 text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium"
              placeholder="Enter dose"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-accent-purple-light/30 text-text-secondary hover:bg-accent-purple-light/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white hover:shadow-theme transition-all"
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
