import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { UserProfile, UnitSystem } from '../../../types';
import TDEECalculator from './TDEECalculator';
import { convertWeightFromKg, convertWeightToKg } from '../../../shared/utils/unitConversion';
import WeightWheelPickerModal from '../../weight/components/WeightWheelPickerModal';
import ImportExportModal from './ImportExportModal';

interface SettingsMenuProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  isOpen: boolean;
  onClose: () => void;
  onGenerateSampleData?: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  profile,
  onProfileUpdate,
  isDarkMode,
  onThemeToggle,
  isOpen,
  onClose,
  onGenerateSampleData,
}) => {
const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [pendingGoalWeight, setPendingGoalWeight] = useState<string>('');
  const [showGoalWeightPicker, setShowGoalWeightPicker] = useState(false);
  const [useWheelForNumbers, setUseWheelForNumbers] = useState(false);
  const [useWheelForDate, setUseCalendarPicker] = useState(true);
  const [showImportExport, setShowImportExport] = useState(false);

  const unitSystem = localProfile.unitSystem || 'metric';

  // Load settings from profile on mount
  useEffect(() => {
    setUseWheelForNumbers(profile.useWheelForNumbers ?? false);
    setUseCalendarPicker(profile.useWheelForDate ?? true);
  }, [profile]);

  // Save settings to profile when they change
  useEffect(() => {
    if (profile.useWheelForNumbers === useWheelForNumbers && profile.useWheelForDate === useWheelForDate) {
      return; // Don't save if values haven't changed
    }
    const updatedProfile = {
      ...profile,
      useWheelForNumbers,
      useWheelForDate,
    };
    onProfileUpdate(updatedProfile);
  }, [useWheelForNumbers, useWheelForDate]);

  // Update local profile when parent profile changes
  useEffect(() => {
    setLocalProfile(profile);
    // Sync pending goal weight with new profile data - no auto decimal
    if (profile.goalWeight) {
      const convertedValue = convertWeightFromKg(profile.goalWeight, unitSystem);
      setPendingGoalWeight(convertedValue % 1 === 0 ? convertedValue.toString() : convertedValue.toFixed(1));
    } else {
      setPendingGoalWeight('');
    }
  }, [profile, unitSystem]);

  // Update pending value when unit system changes
  useEffect(() => {
    if (localProfile.goalWeight) {
      const convertedValue = convertWeightFromKg(localProfile.goalWeight, unitSystem);
      setPendingGoalWeight(convertedValue % 1 === 0 ? convertedValue.toString() : convertedValue.toFixed(1));
    } else {
      setPendingGoalWeight('');
    }
  }, [unitSystem, localProfile.goalWeight]);

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

  // Convert goal weight to display units - no unnecessary decimals
  const goalWeightDisplayValue = localProfile.goalWeight 
    ? (() => {
        const converted = convertWeightFromKg(localProfile.goalWeight, unitSystem);
        return converted % 1 === 0 ? converted.toString() : converted.toFixed(1);
      })()
    : '';

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className={`fixed inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/40'} ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`} style={{ backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div className={`relative rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] sm:max-h-[85vh] p-4 sm:p-6 overflow-hidden flex flex-col ${isClosing ? 'modal-fade-out' : 'modal-content-fade-in'} ${
        isDarkMode
          ? 'bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 border border-[#B19CD9]/30'
          : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'
      }`}>
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Settings
          </h2>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
            {/* Separator */}
            <div className={`border-t ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

            {/* User Settings Section */}
            <div>
              <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-text-primary' : 'text-gray-900'}`} style={{ textShadow: isDarkMode ? '0 0 15px rgba(177,156,217,0.5)' : 'none' }}>User Settings</h3>
              <TDEECalculator profile={localProfile} onProfileUpdate={(updatedProfile) => {
    setLocalProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  }} useWheelForNumbers={useWheelForNumbers} />
              
              {/* Separator */}
              <div className={`border-t my-3 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

              {/* Goal Weight Setting */}
              <div className="space-y-4 mt-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} style={isDarkMode ? { textShadow: '0 0 10px rgba(177,156,217,0.5)' } : {}}>
                    Goal Weight {unitSystem === 'imperial' ? '(lbs)' : '(kg)'}
                  </label>
                  {useWheelForNumbers ? (
                    <button
                      type="button"
                      onClick={() => setShowGoalWeightPicker(true)}
                      className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all ${
                        isDarkMode
                          ? 'border border-[#B19CD9]/50 bg-black/40 text-[#B19CD9]'
                          : 'border border-gray-300 bg-white text-gray-900'
                      }`}
                    >
                      {goalWeightDisplayValue ? `${goalWeightDisplayValue} ${unitSystem === 'imperial' ? 'lbs' : 'kg'}` : `Enter goal weight (${unitSystem === 'imperial' ? 'lbs' : 'kg'})`}
                    </button>
                  ) : (
                    <input
                      type="number"
                      value={goalWeightDisplayValue || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value && value > 0) {
                          const weightInKg = convertWeightToKg(value, unitSystem);
                          onProfileUpdate({ ...localProfile, goalWeight: weightInKg });
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-sm transition-all ${
                        isDarkMode
                          ? 'border border-[#B19CD9]/50 bg-black/40 text-[#B19CD9] placeholder-[#B19CD9]/50'
                          : 'border border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder={`Enter goal weight (${unitSystem === 'imperial' ? 'lbs' : 'kg'})`}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className={`border-t my-3 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

            {/* Input Method Section */}
            <div>
              <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-text-primary' : 'text-gray-900'}`} style={{ textShadow: isDarkMode ? '0 0 15px rgba(177,156,217,0.5)' : 'none' }}>Input Method</h3>
              
              {/* Number Entry */}
              <div className="mb-4">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-text-secondary' : 'text-gray-600'}`}>Number Entry</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setUseWheelForNumbers(true)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                      useWheelForNumbers
                        ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                        : isDarkMode
                          ? 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Wheel
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseWheelForNumbers(false)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                      !useWheelForNumbers
                        ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                        : isDarkMode
                          ? 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Keyboard
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-text-secondary' : 'text-gray-600'}`}>Date Selection</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setUseCalendarPicker(true)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                      useWheelForDate
                        ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                        : isDarkMode
                          ? 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Wheel
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCalendarPicker(false)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                      !useWheelForDate
                        ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                        : isDarkMode
                          ? 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Calendar Picker
                  </button>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className={`border-t my-3 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

            {/* Data Management Section */}
            <div>
              <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-text-primary' : 'text-gray-900'}`} style={{ textShadow: isDarkMode ? '0 0 15px rgba(177,156,217,0.5)' : 'none' }}>Data Management</h3>
              
              <button
                onClick={() => setShowImportExport(true)}
                className={`w-full py-3 px-4 rounded-lg border transition-all duration-300 flex items-center justify-center gap-2 mb-3 ${
                  isDarkMode
                    ? 'border-[#B19CD9]/50 bg-[#B19CD9]/10 text-[#B19CD9] hover:bg-[#B19CD9]/20'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import / Export CSV
              </button>

              {onGenerateSampleData && (
                <button
                  onClick={() => {
                    if (window.confirm('This will clear all current data and generate sample data. Continue?')) {
                      onGenerateSampleData();
                      onClose();
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-lg border transition-all duration-300 flex items-center justify-center gap-2 ${
                    isDarkMode
                      ? 'border-[#4ADEA8]/50 bg-[#4ADEA8]/10 text-[#4ADEA8] hover:bg-[#4ADEA8]/20'
                      : 'border-[#4ADEA8] bg-[#4ADEA8]/10 text-[#2E8B57] hover:bg-[#4ADEA8]/20'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  Load Sample Data (Demo)
                </button>
              )}
            </div>

            {/* Separator */}
            <div className={`border-t my-3 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

            {/* Appearance Section */}
            <div>
              <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-text-primary' : 'text-gray-900'}`} style={{ textShadow: isDarkMode ? '0 0 15px rgba(177,156,217,0.5)' : 'none' }}>Appearance</h3>
              <div className={`flex items-center justify-between p-3 rounded-lg border ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-accent-purple-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className={isDarkMode ? 'text-text-muted' : 'text-gray-600'}>Dark Mode</span>
                </div>
                <button
                  onClick={onThemeToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    isDarkMode ? 'bg-gradient-to-r from-accent-purple-light to-accent-purple-medium shadow-theme' : 'bg-gray-400/50'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-sm ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-card-border">
              <button
                onClick={onClose}
                className={`px-6 py-2 transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Close
              </button>
            </div>
        </div>
      </div>

      <WeightWheelPickerModal
        isOpen={showGoalWeightPicker}
        onSave={(value) => {
          const weightValue = parseFloat(value);
          if (weightValue && weightValue > 0) {
            const weightInKg = convertWeightToKg(weightValue, unitSystem);
            setPendingGoalWeight(value);
            onProfileUpdate({ ...localProfile, goalWeight: weightInKg });
          }
          setShowGoalWeightPicker(false);
        }}
        onClose={() => setShowGoalWeightPicker(false)}
        min={1}
        max={unitSystem === 'imperial' ? 1100 : 500}
        label="Goal Weight"
        decimals={1}
        defaultValue={goalWeightDisplayValue || (unitSystem === 'imperial' ? '150' : '70')}
      />

      <ImportExportModal
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        isDarkMode={isDarkMode}
        onImportComplete={() => {
          // Refresh data after import
        }}
      />
    </div>,
    document.body
  );
};

export default SettingsMenu;