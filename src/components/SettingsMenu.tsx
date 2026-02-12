import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { UserProfile, UnitSystem } from '../types';
import TDEECalculator from './TDEECalculator';
import { convertWeightFromKg, convertWeightToKg } from '../utils/unitConversion';

interface SettingsMenuProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  profile,
  onProfileUpdate,
  isDarkMode,
  onThemeToggle,
  isOpen,
  onClose,
}) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);

  // Update local profile when parent profile changes
  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  if (!isOpen) return null;

  const unitSystem = localProfile.unitSystem || 'metric';

  // Convert goal weight to display units
  const goalWeightDisplayValue = localProfile.goalWeight 
    ? convertWeightFromKg(localProfile.goalWeight, unitSystem)
    : '';

  const handleUnitSystemChange = (newUnitSystem: UnitSystem) => {
    const updatedProfile = { ...localProfile, unitSystem: newUnitSystem };
    setLocalProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  };

  const handleGoalWeightChange = (displayValue: string) => {
    if (!displayValue) {
      const updatedProfile = { ...localProfile, goalWeight: undefined };
      setLocalProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      return;
    }
    
    const displayWeight = parseFloat(displayValue);
    if (displayWeight > 0) {
      const weightInKg = convertWeightToKg(displayWeight, unitSystem);
      const updatedProfile = { ...localProfile, goalWeight: weightInKg };
      setLocalProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-card-bg backdrop-blur-3xl rounded-2xl shadow-theme-lg max-w-md w-full mx-auto border border-card-border overflow-y-auto hide-scrollbar" style={{ maxHeight: '80vh' }}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-text-primary" style={{ textShadow: isDarkMode ? '0 0 20px rgba(177,156,217,0.6)' : '0 0 20px rgba(45,27,78,0.3)' }}>Settings</h2>
            <button
              onClick={onClose}
              className="text-accent-purple-medium hover:text-accent-purple-light text-2xl leading-none p-1 rounded-lg hover:bg-accent-purple-light/10 transition-all duration-300"
              style={{ textShadow: isDarkMode ? '0 0 10px rgba(177,156,217,0.5)' : '0 0 10px rgba(45,27,78,0.2)' }}
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* User Settings Section */}
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-4" style={{ textShadow: isDarkMode ? '0 0 15px rgba(177,156,217,0.5)' : '0 0 15px rgba(45,27,78,0.2)' }}>User Settings</h3>
              <TDEECalculator profile={localProfile} onProfileUpdate={(updatedProfile) => {
    setLocalProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  }} />
              
              {/* Unit System Setting */}
              <div className="space-y-4 mt-4">
                <div>
                  <label htmlFor="unitSystem" className="block text-sm font-medium text-accent-purple-light mb-2" style={{ textShadow: isDarkMode ? '0 0 10px rgba(177,156,217,0.5)' : '0 0 10px rgba(45,27,78,0.2)' }}>
                    Units
                  </label>
                  <select
                    id="unitSystem"
                    value={localProfile.unitSystem || 'metric'}
                    onChange={(e) => handleUnitSystemChange(e.target.value as UnitSystem)}
                    className="w-full px-3 py-2 border border-accent-purple-light/30 bg-card-bg backdrop-blur-sm text-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium placeholder-text-muted transition-all duration-300"
                  >
                    <option value="metric">Metric (kg, cm)</option>
                    <option value="imperial">Imperial (lbs, ft/in)</option>
                  </select>
                </div>
              </div>

              {/* Goal Weight Setting */}
              <div className="space-y-4 mt-4">
                <div>
                  <label htmlFor="goalWeight" className="block text-sm font-medium text-accent-purple-light mb-2" style={{ textShadow: isDarkMode ? '0 0 10px rgba(177,156,217,0.5)' : '0 0 10px rgba(45,27,78,0.2)' }}>
                    Goal Weight {profile.unitSystem === 'imperial' ? '(lbs)' : '(kg)'}
                  </label>
                  <input
                    type="number"
                    id="goalWeight"
                    step="0.1"
                    min={unitSystem === 'imperial' ? "66" : "30"}
                    max={unitSystem === 'imperial' ? "661" : "300"}
                    value={goalWeightDisplayValue}
                    onChange={(e) => handleGoalWeightChange(e.target.value)}
                    className="w-full px-3 py-2 border border-accent-purple-light/30 bg-card-bg backdrop-blur-sm text-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium placeholder-text-muted transition-all duration-300"
                    placeholder={`Enter your goal weight (${unitSystem === 'imperial' ? 'lbs' : 'kg'})`}
                  />
                </div>
              </div>
            </div>

            {/* Appearance Section */}
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-4" style={{ textShadow: isDarkMode ? '0 0 15px rgba(177,156,217,0.5)' : '0 0 15px rgba(45,27,78,0.2)' }}>Appearance</h3>
              <div className="flex items-center justify-between p-3 rounded-lg border border-accent-purple-light/20">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-accent-purple-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-text-muted">Dark Mode</span>
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
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettingsMenu;