import React, { useState, useEffect } from 'react';
import { GLP1Protocol } from '../../../types';
import { MEDICATIONS, Medication } from '../../../constants/medications';
import DateWheelPickerModal from '../../../shared/components/DateWheelPickerModal';
import DoseWheelPickerModal from '../../../shared/components/DoseWheelPickerModal';
import BottomSheetModal from '../../../shared/components/BottomSheetModal';
import { useProtocolForm, frequencyOptions, durationPresets, toLocalDateString } from '../hooks/useProtocolForm';
import { useTheme } from '../../../contexts/ThemeContext';

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
  const { isDarkMode } = useTheme();
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStopDatePicker, setShowStopDatePicker] = useState(false);
  const [showDosePicker, setShowDosePicker] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const {
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
    selectedDurationDays,
    setSelectedDurationDays,
    customMedication,
    setCustomMedication,
    showOtherModal,
    setShowOtherModal,
    MAIN_MEDICATIONS,
    getAllMedicationIds,
    applyMedicationDefaults,
    handleSave: formHandleSave,
  } = useProtocolForm({
    isOpen,
    mode,
    protocol,
    existingProtocols,
  });

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

  const handleMedicationSelect = (medicationId: string) => {
    if (medicationId === 'other') {
      setShowOtherModal(true);
    } else {
      applyMedicationDefaults(medicationId);
    }
  };

  const handleSave = () => {
    const newProtocol = formHandleSave();
    if (newProtocol) {
      onSave(newProtocol);
      onClose();
    }
  };

  const handleDurationPreset = (days: number) => {
    setSelectedDurationDays(days);
    if (startDate) {
      const endDate = new Date(new Date(startDate).getTime() + days * 24 * 60 * 60 * 1000);
      setStopDate(toLocalDateString(endDate));
    }
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    setContinuationInfo(null);
    if (selectedDurationDays && date) {
      const endDate = new Date(new Date(date).getTime() + selectedDurationDays * 24 * 60 * 60 * 1000);
      setStopDate(toLocalDateString(endDate));
    }
  };

  const handleCustomMedicationAdd = () => {
    if (customMedication.trim()) {
      setSelectedMedication('custom:' + customMedication.trim());
      setDose('1');
      setShowOtherModal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className={`fixed inset-0 bg-black/60 ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`} style={{ backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div className={`relative rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto ${
        isDarkMode 
          ? 'bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95' 
          : 'bg-white/95'
      } ${isClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
        <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {mode === 'add' ? 'Add Custom Plan' : 'Edit Protocol'}
        </h2>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Medication</label>
            <div className="grid grid-cols-2 gap-2">
              {MAIN_MEDICATIONS.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => handleMedicationSelect(med.id)}
                  className={`text-left px-3 py-2 rounded-lg transition-all text-sm ${
                    selectedMedication === med.id
                      ? 'bg-[#B19CD9]/30 border border-[#B19CD9]'
                      : isDarkMode
                        ? 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10'
                        : 'bg-gray-100 border border-transparent hover:bg-gray-200'
                  }`}
                >
                  <span className={isDarkMode ? 'text-text-primary' : 'text-gray-900'}>{med.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-3"></div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Dose (mg)</label>
              <button
                type="button"
                onClick={() => setShowDosePicker(true)}
                className={`w-full px-3 py-2 border rounded-lg text-sm text-left ${
                  isDarkMode
                    ? 'border-[#B19CD9]/30 bg-black/20 text-[#B19CD9]'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                {dose ? `${dose} mg` : 'Select dose'}
              </button>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Dosing Schedule</label>
              <button
                type="button"
                onClick={() => setShowSchedulePicker(true)}
                className={`w-full px-3 py-2 border rounded-lg text-sm text-left ${
                  isDarkMode
                    ? 'border-[#B19CD9]/30 bg-black/20 text-[#B19CD9]'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                {frequencyOptions.find(f => f.value === frequency)?.label || 'Select schedule'}
              </button>
            </div>
            <p className="col-span-2 text-xs text-[#4ADEA8] mt-1">Pre-filled with official label dose. Enter only the dose prescribed by your healthcare provider.</p>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-3"></div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Start Date</label>
            <button
              type="button"
              onClick={() => setShowStartDatePicker(true)}
              className={`w-full px-3 py-2 border rounded-lg text-sm text-left ${
                isDarkMode
                  ? 'border-[#B19CD9]/30 bg-black/20 text-[#B19CD9]'
                  : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              {startDate ? new Date(startDate).toLocaleDateString() : 'Select date'}
            </button>
            {continuationInfo && (
              <p className="text-xs text-[#4ADEA8] mt-1">{continuationInfo}</p>
            )}
            <div className="flex gap-2 mt-2">
              {durationPresets.map((preset) => {
                const isSelected = selectedDurationDays === preset.days;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleDurationPreset(preset.days)}
                    className={`flex-1 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                        : isDarkMode
                          ? 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
                          : 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>End Date</label>
            <button
              type="button"
              onClick={() => setShowStopDatePicker(true)}
              className={`w-full px-3 py-2 border rounded-lg text-sm text-left ${
                isDarkMode
                  ? 'border-[#B19CD9]/30 bg-black/20 text-[#B19CD9]'
                  : 'border-gray-300 bg-white text-gray-700'
              }`}
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
                  className={`flex-1 px-4 py-2 rounded-lg border transition-all text-sm ${
                    isDarkMode
                      ? 'border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
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
                  className={`flex-1 px-4 py-2 rounded-lg border transition-all text-sm ${
                    isDarkMode
                      ? 'border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
              </>
            )}
            {mode === 'add' && (
              <button
                onClick={onClose}
                className={`flex-1 px-4 py-2 rounded-lg border transition-all text-sm ${
                  isDarkMode
                    ? 'border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
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
          <div className={`relative rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-xs p-6 max-h-[90vh] overflow-y-auto ${
            isDarkMode 
              ? 'bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95' 
              : 'bg-white/95'
          } modal-content-fade-in`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Select Medication</h3>
            <div className="space-y-2 mb-4">
              {MEDICATIONS.filter(m => !getAllMedicationIds().includes(m.id) || m.id === 'other').map((med: Medication) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => {
                    applyMedicationDefaults(med.id);
                    setShowOtherModal(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
                    selectedMedication === med.id
                      ? 'bg-[#B19CD9]/30 border border-[#B19CD9]'
                      : isDarkMode
                        ? 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10'
                        : 'bg-gray-100 border border-transparent hover:bg-gray-200'
                  }`}
                >
                  <span className={isDarkMode ? 'text-text-primary' : 'text-gray-900'}>{med.name}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-[#B19CD9]/20 pt-4">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-[#B19CD9]' : 'text-[#9C7BD3]'}`}>Or enter custom medication</label>
              <input
                type="text"
                value={customMedication}
                onChange={(e) => setCustomMedication(e.target.value)}
                placeholder="Custom medication name"
                className={`w-full px-3 py-2 border rounded-lg text-sm mb-2 ${
                  isDarkMode
                    ? 'border-[#B19CD9]/30 bg-black/20 text-white'
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              />
              <button
                onClick={handleCustomMedicationAdd}
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
          onChange={handleStartDateChange}
          onClose={() => setShowStartDatePicker(false)}
        />
      )}

      {showStopDatePicker && (
        <DateWheelPickerModal
          isOpen={showStopDatePicker}
          value={stopDate}
          onChange={(date) => setStopDate(date)}
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
