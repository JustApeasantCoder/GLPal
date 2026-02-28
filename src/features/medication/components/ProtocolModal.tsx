import React, { useState, useEffect, useMemo } from 'react';
import { GLP1Protocol } from '../../../types';
import { MEDICATIONS, Medication } from '../../../constants/medications';
import DateWheelPickerModal from '../../../shared/components/DateWheelPickerModal';
import DoseWheelPickerModal from '../../../shared/components/DoseWheelPickerModal';
import CalendarPickerModal from '../../../shared/components/CalendarPickerModal';
import BottomSheetModal from '../../../shared/components/BottomSheetModal';
import { useProtocolForm, frequencyOptions, durationPresets, toLocalDateString } from '../hooks/useProtocolForm';
import { useTheme, useThemeStyles } from '../../../contexts/ThemeContext';
import { saveCustomMedication, getCustomMedications } from '../../../shared/utils/database';

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (protocol: GLP1Protocol) => void;
  onDelete?: (id: string) => void;
  protocol?: GLP1Protocol | null;
  mode: 'add' | 'edit';
  existingProtocols?: GLP1Protocol[];
  useWheelForNumbers?: boolean;
  useWheelForDate?: boolean;
}

const ProtocolModal: React.FC<ProtocolModalProps> = ({ isOpen, onClose, onSave, onDelete, protocol, mode, existingProtocols, useWheelForNumbers = true, useWheelForDate = true }) => {
  const { isDarkMode } = useTheme();
  const { segmentButton, inputButton, input: inputStyle, textarea, primaryButton, secondaryButton, modal, modalText, modalContainer, modalBackdrop, modalSmall, modalLabel, cancelButton, saveButton, deleteButton } = useThemeStyles();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    customHalfLife,
    setCustomHalfLife,
    savedMedications,
    savedCustomMedications,
    setSavedCustomMedications,
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
      setShowDeleteConfirm(false);
      document.body.classList.add('modal-open');
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
        setShowDeleteConfirm(false);
        document.body.classList.remove('modal-open');
      }, 200);
    }
  }, [isOpen]);

  const dosePresets = useMemo(() => {
    if (!selectedMedication) return ['0.25', '0.5', '1', '2.5', '5', '7.5', '10'];
    const med = MEDICATIONS.find(m => m.id === selectedMedication);
    if (!med || !med.titrationDoses) return ['0.25', '0.5', '1', '2.5', '5', '7.5', '10'];
    return med.titrationDoses.map(d => d.toString());
  }, [selectedMedication]);

  if (!isVisible) return null;

  const handleMedicationSelect = (medicationId: string) => {
    if (medicationId === 'other') {
      setShowOtherModal(true);
    } else if (savedCustomMedications.includes(medicationId)) {
      setSelectedMedication(medicationId);
      setCustomMedication('');
      setCustomHalfLife('');
      setDose('1');
    } else {
      setCustomMedication('');
      setCustomHalfLife('');
      applyMedicationDefaults(medicationId);
    }
  };

  const handleSave = () => {
    if (customMedication.trim()) {
      saveCustomMedication(customMedication.trim());
    }
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className={`${modalBackdrop(isClosing)}`} style={{ backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div className={`relative rounded-2xl ${modal} ${modalContainer} ${isClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${modalText.title}`}>
            {mode === 'add' ? 'Add Custom Plan' : 'Edit Protocol'}
          </h2>
          {mode === 'edit' && (
            <div className="flex gap-1">
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>

        <div className="space-y-4">
          <div>
            <label className={`${modalLabel} ${modalText.label}`}>Medication</label>
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
                  <span className={modalText.value}>{med.name}</span>
                </button>
              ))}
              {savedCustomMedications.length > 0 && savedCustomMedications.map((customMed) => (
                <button
                  key={customMed}
                  type="button"
                  onClick={() => handleMedicationSelect(customMed)}
                  className={`text-left px-3 py-2 rounded-lg transition-all text-sm ${
                    selectedMedication === customMed
                      ? 'bg-[#B19CD9]/30 border border-[#B19CD9]'
                      : isDarkMode
                        ? 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10'
                        : 'bg-gray-100 border border-transparent hover:bg-gray-200'
                  }`}
                >
                  <span className={modalText.value}>{customMed}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-3"></div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`${modalLabel} ${modalText.label}`}>Dose (mg)</label>
              {useWheelForNumbers ? (
                <button
                  type="button"
                  onClick={() => setShowDosePicker(true)}
                  className={inputButton}
                >
                  {dose ? `${dose} mg` : 'Select dose'}
                </button>
              ) : (
                <input
                  type="number"
                  step="0.25"
                  value={dose || ''}
                  onChange={(e) => setDose(e.target.value)}
                  className={inputStyle}
                  placeholder="Enter dose"
                />
              )}
            </div>
            <div>
              <label className={`${modalLabel} ${modalText.label}`}>Dosing Schedule</label>
              <button
                type="button"
                onClick={() => setShowSchedulePicker(true)}
                className={inputButton}
              >
                {frequencyOptions.find(f => f.value === frequency)?.label || 'Select schedule'}
              </button>
            </div>
            <p className="col-span-2 text-xs text-[#4ADEA8] mt-1">Pre-filled with official label dose. Enter only the dose prescribed by your healthcare provider.</p>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-3"></div>

          <div>
            <label className={`${modalLabel} ${modalText.label}`}>Start Date</label>
            <button
              type="button"
              onClick={() => setShowStartDatePicker(true)}
              className={inputButton}
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
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#B19CD9] text-white'
                        : isDarkMode
                          ? 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#9C7BD3]/30 hover:bg-[#B19CD9]/20'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={`${modalLabel} ${modalText.label}`}>End Date</label>
            <button
              type="button"
              onClick={() => setShowStopDatePicker(true)}
              className={inputButton}
            >
              {stopDate ? new Date(stopDate).toLocaleDateString() : 'Select date'}
            </button>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-3"></div>

          <div className="flex gap-2">
            {mode === 'edit' && (
              <>
                <button
                  onClick={onClose}
                  className={cancelButton(isDarkMode)}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className={saveButton}
                >
                  Save
                </button>
              </>
            )}
            {mode === 'add' && (
              <>
                <button
                  onClick={onClose}
                  className={cancelButton(isDarkMode)}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className={saveButton}
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showOtherModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className={`${modalBackdrop(false)}`} style={{ backdropFilter: 'blur(8px)' }} onClick={() => setShowOtherModal(false)} />
          <div className={`relative rounded-2xl ${modal} ${modalSmall} modal-content-fade-in`}>
            <h3 className={`text-lg font-semibold mb-4 ${modalText.title}`}>Select Medication</h3>
            <div className="space-y-2 mb-4">
              {MEDICATIONS.filter(m => !getAllMedicationIds().includes(m.id) && m.id !== 'other').map((med: Medication) => (
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
                  <span className={modalText.value}>{med.name}</span>
                </button>
              ))}
              {savedCustomMedications.length > 0 && (
                <>
                  <div className={`border-t border-[#B19CD9]/20 my-2`}></div>
                  {savedCustomMedications.map((customMed) => (
                    <button
                      key={customMed}
                      type="button"
                      onClick={() => {
                        setSelectedMedication(customMed);
                        setDose('1');
                        setShowOtherModal(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
                        selectedMedication === customMed
                          ? 'bg-[#B19CD9]/30 border border-[#B19CD9]'
                          : isDarkMode
                            ? 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10'
                            : 'bg-gray-100 border border-transparent hover:bg-gray-200'
                      }`}
                    >
                      <span className={modalText.value}>{customMed}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
            <div className="border-t border-[#B19CD9]/20 pt-4">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-[#B19CD9]' : 'text-[#9C7BD3]'}`}>Or enter custom medication</label>
              <input
                type="text"
                value={customMedication}
                onChange={(e) => {
                  setCustomMedication(e.target.value);
                  if (e.target.value.trim()) {
                    setSelectedMedication('');
                  }
                }}
                placeholder="Custom medication name"
                className={`${inputStyle} mb-2`}
              />
              {customMedication.trim() && (
                <div className="mb-2">
                  <input
                    type="number"
                    value={customHalfLife}
                    onChange={(e) => setCustomHalfLife(e.target.value)}
                    placeholder="Half-life (hours) - optional"
                    className={inputStyle}
                    step="1"
                    min="0"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-[#B19CD9]/20">
              <button
                type="button"
                onClick={() => setShowOtherModal(false)}
                className={`flex-1 py-2 rounded-lg border transition-colors text-sm ${
                  isDarkMode
                    ? 'border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (customMedication.trim()) {
                    saveCustomMedication(customMedication.trim());
                    setSelectedMedication(customMedication.trim());
                    setDose('1');
                    setSavedCustomMedications(getCustomMedications());
                  }
                  setTimeout(() => setShowOtherModal(false), 0);
                }}
                disabled={!customMedication.trim()}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  customMedication.trim()
                    ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white hover:shadow-[0_0_15px_rgba(177,156,217,0.5)]'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showStartDatePicker && (
        useWheelForDate ? (
          <DateWheelPickerModal
            isOpen={showStartDatePicker}
            value={startDate}
            onChange={handleStartDateChange}
            onClose={() => setShowStartDatePicker(false)}
          />
        ) : (
          <CalendarPickerModal
            isOpen={showStartDatePicker}
            value={startDate}
            onChange={handleStartDateChange}
            onClose={() => setShowStartDatePicker(false)}
          />
        )
      )}

      {showStopDatePicker && (
        useWheelForDate ? (
          <DateWheelPickerModal
            isOpen={showStopDatePicker}
            value={stopDate}
            onChange={(date) => setStopDate(date)}
            onClose={() => setShowStopDatePicker(false)}
          />
        ) : (
          <CalendarPickerModal
            isOpen={showStopDatePicker}
            value={stopDate}
            onChange={(date) => setStopDate(date)}
            onClose={() => setShowStopDatePicker(false)}
          />
        )
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
          presets={dosePresets}
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <div className={`${modalBackdrop(false)}`} style={{ backdropFilter: 'blur(8px)' }} onClick={() => setShowDeleteConfirm(false)} />
          <div className={`relative rounded-2xl ${modal} ${modalSmall} border border-red-500/30 modal-content-fade-in`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Delete Protocol?</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={cancelButton(isDarkMode)}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (protocol && onDelete) {
                    onDelete(protocol.id);
                  }
                  onClose();
                }}
                className={deleteButton(isDarkMode)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocolModal;
