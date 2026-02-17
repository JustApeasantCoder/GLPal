import React, { useState } from 'react';
import { GLP1Protocol } from '../../../types';
import { MEDICATIONS, generateId } from '../../../constants/medications';
import DateWheelPickerModal from '../../../shared/components/DateWheelPickerModal';

interface OfficialScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (protocols: GLP1Protocol[]) => void;
}

const OfficialScheduleModal: React.FC<OfficialScheduleModalProps> = ({ isOpen, onClose, onSave }) => {
  const [selectedMedication, setSelectedMedication] = useState<string>('semaglutide');
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [splitDosing, setSplitDosing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (!isOpen) return null;

  const handleCreate = () => {
    const med = MEDICATIONS.find(m => m.id === selectedMedication);
    if (!med?.titrationDoses || med.titrationDoses.length === 0) return;
    
    const titrationDoses = med.titrationDoses;
    const daysPerDose = 28;
    const freqValue = splitDosing ? 2 : 1;

    const titrationProtocols: GLP1Protocol[] = titrationDoses.map((titrationDose, index) => {
      const phaseStart = new Date(new Date(startDate).getTime() + index * daysPerDose * 24 * 60 * 60 * 1000);
      const phaseEnd = new Date(new Date(startDate).getTime() + (index + 1) * daysPerDose * 24 * 60 * 60 * 1000 - 1);

      return {
        id: generateId(),
        medication: med.name,
        dose: splitDosing ? titrationDose / 2 : titrationDose,
        frequencyPerWeek: freqValue,
        startDate: phaseStart.toISOString().split('T')[0],
        stopDate: phaseEnd.toISOString().split('T')[0],
        halfLifeHours: med.halfLifeHours,
        phase: 'titrate' as const,
      };
    });

    onSave(titrationProtocols);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div 
        className="fixed inset-0 bg-black/60" 
        style={{ backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }} 
        onClick={onClose} 
      />
      <div 
        className="relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-sm p-6"
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        <h2 className="text-xl font-semibold text-white mb-6">Add Schedule</h2>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Medication</label>
            <div className="grid grid-cols-1 gap-2">
              {MEDICATIONS.filter(m => m.titrationDoses && m.titrationDoses.length > 0 && ['semaglutide', 'tirzepatide', 'retatrutide', 'cagrilintide'].includes(m.id)).map(med => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => setSelectedMedication(med.id)}
                  className={`text-left px-3 py-2 rounded-lg transition-all text-sm ${
                    selectedMedication === med.id
                      ? 'bg-[#B19CD9]/30 border border-[#B19CD9]'
                      : 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10'
                  }`}
                >
                  <span className="text-text-primary">{med.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-4"></div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Split Dosing</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSplitDosing(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  !splitDosing
                    ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white'
                    : 'bg-black/20 text-[#B19CD9] border border-[#B19CD9]/30'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setSplitDosing(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  splitDosing
                    ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white'
                    : 'bg-black/20 text-[#B19CD9] border border-[#B19CD9]/30'
                }`}
              >
                Yes
              </button>
            </div>
            {splitDosing && (
              <p className="text-xs text-[#4ADEA8] mt-1">Dose will be split in half and taken every 3.5 days</p>
            )}
          </div>

          <div className="border-t border-[#B19CD9]/20 my-4"></div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Start Date</label>
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-[#B19CD9] rounded-lg text-sm text-left"
            >
              {new Date(startDate).toLocaleDateString()}
            </button>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-4"></div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-medium hover:shadow-[0_0_20px_rgba(177,156,217,0.5)] transition-all"
            >
              Create
            </button>
          </div>
        </div>
      </div>

      <DateWheelPickerModal
        isOpen={showDatePicker}
        value={startDate}
        onChange={(date) => {
          setStartDate(date);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />
    </div>
  );
};

export default OfficialScheduleModal;
