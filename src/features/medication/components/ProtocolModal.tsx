import React, { useState, useEffect } from 'react';
import { GLP1Protocol } from '../../../types';
import DateWheelPickerModal from '../../../shared/components/DateWheelPickerModal';
import DoseWheelPickerModal from '../../../shared/components/DoseWheelPickerModal';
import BottomSheetModal from '../../../shared/components/BottomSheetModal';
import { useProtocolForm } from './useProtocolForm';
import DurationPresets from './DurationPresets';
import { MEDICATIONS } from '../../../constants/medications';

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

const ProtocolModal: React.FC<ProtocolModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onArchive,
  onDelete,
  protocol,
  mode,
  existingProtocols,
}) => {
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStopDatePicker, setShowStopDatePicker] = useState(false);
  const [showDosePicker, setShowDosePicker] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  const {
    formState,
    selectedDurationDays,
    showOtherModal,
    customMedication,
    mainMedications,
    frequencyOptions: freqOptions,
    setShowOtherModal,
    setCustomMedication,
    setSelectedDurationDays,
    updateField,
    handleMedicationSelect,
    handleSave,
  } = useProtocolForm({ protocol, mode, existingProtocols });

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
  }, [isOpen, isVisible, isClosing]);

  if (!isVisible) return null;

  const handleConfirmSave = () => {
    const newProtocol = handleSave();
    if (newProtocol) {
      onSave(newProtocol);
      onClose();
    }
  };

  const handleConfirmAction = () => {
    if (protocol) {
      if (confirmAction === 'archive' && onArchive) {
        onArchive(protocol);
      }
      if (confirmAction === 'delete' && onDelete) {
        onDelete(protocol.id);
      }
      onClose();
    }
  };

  const handleCustomMedication = () => {
    if (customMedication.trim()) {
      updateField('selectedMedication', 'custom:' + customMedication.trim());
      updateField('dose', '1');
      setShowOtherModal(false);
    }
  };

  const handleStartDateChange = (date: string) => {
    updateField('startDate', date);
    updateField('continuationInfo', null);
    if (selectedDurationDays && date) {
      const endDate = new Date(
        new Date(date).getTime() + selectedDurationDays * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split('T')[0];
      updateField('stopDate', endDate);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className={`fixed inset-0 bg-black/60 ${
            isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'
          }`}
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        />
        <div
          className={`relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-sm p-6 ${
            isClosing ? 'modal-fade-out' : 'modal-content-fade-in'
          }`}
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            {mode === 'add' ? 'Add Custom Plan' : 'Edit Protocol'}
          </h2>
          <div className="border-t border-[#B19CD9]/20 mb-3"></div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#B19CD9] mb-2">
                Medication
              </label>
              <div className="grid grid-cols-2 gap-2">
                {mainMedications.map((med) => (
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
                      formState.selectedMedication === med.id
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
                <label className="block text-sm font-medium text-[#B19CD9] mb-2">
                  Dose (mg)
                </label>
                <button
                  type="button"
                  onClick={() => setShowDosePicker(true)}
                  className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm text-left"
                >
                  {formState.dose ? `${formState.dose} mg` : 'Select dose'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B19CD9] mb-2">
                  Dosing Schedule
                </label>
                <button
                  type="button"
                  onClick={() => setShowSchedulePicker(true)}
                  className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm text-left"
                >
                  {freqOptions.find((f) => f.value === formState.frequency)
                    ?.label || 'Select schedule'}
                </button>
              </div>
              <p className="col-span-2 text-xs text-[#4ADEA8] mt-1">
                Pre-filled with official label dose. Enter only the dose
                prescribed by your healthcare provider.
              </p>
            </div>

            <div className="border-t border-[#B19CD9]/20 my-3"></div>

            <div>
              <label className="block text-sm font-medium text-[#B19CD9] mb-2">
                Start Date
              </label>
              <button
                type="button"
                onClick={() => setShowStartDatePicker(true)}
                className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm text-left"
              >
                {formState.startDate
                  ? new Date(formState.startDate).toLocaleDateString()
                  : 'Select date'}
              </button>
              {formState.continuationInfo && (
                <p className="text-xs text-[#4ADEA8] mt-1">
                  {formState.continuationInfo}
                </p>
              )}
              <DurationPresets
                selectedDays={selectedDurationDays}
                onSelect={setSelectedDurationDays}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B19CD9] mb-2">
                End Date
              </label>
              <button
                type="button"
                onClick={() => setShowStopDatePicker(true)}
                className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm text-left"
              >
                {formState.stopDate
                  ? new Date(formState.stopDate).toLocaleDateString()
                  : 'Select date'}
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
                    onClick={handleConfirmAction}
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
                  onClick={handleConfirmSave}
                  className={`${
                    mode === 'edit' ? 'flex-1' : 'flex-1'
                  } bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:shadow-theme transition-all text-sm`}
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showOtherModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div
            className={`fixed inset-0 bg-black/60 ${
              showOtherModal ? 'backdrop-fade-in' : 'backdrop-fade-out'
            }`}
            style={{ backdropFilter: 'blur(8px)' }}
            onClick={() => setShowOtherModal(false)}
          />
          <div className="relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-xs p-6 modal-content-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4">
              Select Medication
            </h3>
            <div className="space-y-2 mb-4">
              {MEDICATIONS.filter(
                (m) =>
                  !mainMedications.map((mm) => mm.id).includes(m.id) ||
                  m.id === 'other'
              ).map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => {
                    handleMedicationSelect(med.id);
                    setShowOtherModal(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm text-white ${
                    formState.selectedMedication === med.id
                      ? 'bg-[#B19CD9]/30 border border-[#B19CD9]'
                      : 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10'
                  }`}
                >
                  {med.name}
                </button>
              ))}
            </div>
            <div className="border-t border-[#B19CD9]/20 pt-4">
              <label className="block text-sm font-medium text-[#B19CD9] mb-2">
                Or enter custom medication
              </label>
              <input
                type="text"
                value={customMedication}
                onChange={(e) => setCustomMedication(e.target.value)}
                placeholder="Custom medication name"
                className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm mb-2"
              />
              <button
                onClick={handleCustomMedication}
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
          value={formState.startDate}
          onChange={handleStartDateChange}
          onClose={() => setShowStartDatePicker(false)}
        />
      )}

      {showStopDatePicker && (
        <DateWheelPickerModal
          isOpen={showStopDatePicker}
          value={formState.stopDate}
          onChange={(date) => updateField('stopDate', date)}
          onClose={() => setShowStopDatePicker(false)}
        />
      )}

      {showDosePicker && (
        <DoseWheelPickerModal
          isOpen={showDosePicker}
          onSave={(value) => {
            updateField('dose', value);
            setShowDosePicker(false);
          }}
          onClose={() => setShowDosePicker(false)}
          min={0}
          max={100}
          label="Select Dose (mg)"
          decimals={2}
          defaultValue={formState.dose || '0.25'}
        />
      )}

      <BottomSheetModal
        isOpen={showSchedulePicker}
        title="Dosing Schedule"
        options={freqOptions}
        value={formState.frequency}
        onSelect={(val) => {
          updateField('frequency', String(val));
          setShowSchedulePicker(false);
        }}
        onClose={() => setShowSchedulePicker(false)}
      />
    </>
  );
};

export default ProtocolModal;
