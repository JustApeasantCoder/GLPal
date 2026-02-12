import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { UserProfile } from '../types';
import TDEECalculator from './TDEECalculator';
import DosageCalculator from './DosageCalculator';

interface SettingsDropdownProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onGoalUpdate?: (goalWeight: number) => void;
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
  profile,
  onProfileUpdate,
  isDarkMode,
  onThemeToggle,
  onGoalUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTDEESettings, setShowTDEESettings] = useState(false);
  const [showDosageCalculator, setShowDosageCalculator] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTDEESettingsClick = () => {
    setShowTDEESettings(true);
    setIsOpen(false);
  };

  const handleDosageCalculatorClick = () => {
    setShowDosageCalculator(true);
    setIsOpen(false);
  };

  if (showTDEESettings) {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-card-bg backdrop-blur-3xl rounded-2xl shadow-theme-lg max-w-md w-full mx-auto border border-card-border overflow-y-auto hide-scrollbar" style={{ maxHeight: '80vh' }}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-text-primary" style={{ textShadow: isDarkMode ? '0 0 20px rgba(177,156,217,0.6)' : '0 0 20px rgba(45,27,78,0.3)' }}>User Settings</h2>
              <button
                onClick={() => setShowTDEESettings(false)}
                className="text-accent-purple-medium hover:text-accent-purple-light text-2xl leading-none p-1 rounded-lg hover:bg-accent-purple-light/10 transition-all duration-300"
                style={{ textShadow: isDarkMode ? '0 0 10px rgba(177,156,217,0.5)' : '0 0 10px rgba(45,27,78,0.2)' }}
              >
                ×
              </button>
            </div>
            <TDEECalculator profile={profile} onProfileUpdate={onProfileUpdate} onClose={() => setShowTDEESettings(false)} />
            
            {/* Goal Weight Setting */}
            <div className="space-y-4">
              <div>
                <label htmlFor="goalWeight" className="block text-sm font-medium text-accent-purple-light mb-2" style={{ textShadow: isDarkMode ? '0 0 10px rgba(177,156,217,0.5)' : '0 0 10px rgba(45,27,78,0.2)' }}>
                  Goal Weight (kg)
                </label>
                <input
                  type="number"
                  id="goalWeight"
                  step="0.1"
                  min="30"
                  max="300"
                  defaultValue={profile.goalWeight || 80}
                  className="w-full px-3 py-2 border border-accent-purple-light/30 bg-card-bg backdrop-blur-sm text-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium placeholder-text-muted transition-all duration-300"
                  placeholder="Enter your goal weight"
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    const input = document.getElementById('goalWeight') as HTMLInputElement;
                    const newGoalWeight = parseFloat(input?.value || '80');
                    if (newGoalWeight && newGoalWeight > 0 && newGoalWeight < 500) {
                      // Update profile with new goal weight
                      const updatedProfile = { ...profile, goalWeight: newGoalWeight };
                      onProfileUpdate(updatedProfile);
                    }
                    setShowTDEESettings(false);
                  }}
                  className="bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white px-4 py-2 rounded-lg hover:from-accent-purple-dark hover:to-accent-purple-medium transition-all duration-300 shadow-theme hover:shadow-theme-lg transform hover:scale-[1.02]"
                >
                  Save Goal
                </button>
              </div>
            </div>

            {/* Save Profile Button */}
            {/* <button
                onClick={() => {
                  const input = document.getElementById('goalWeight') as HTMLInputElement;
                  const newGoalWeight = parseFloat(input?.value || profile.goalWeight?.toString() || '80');
                  if (newGoalWeight && newGoalWeight > 0 && newGoalWeight < 500) {
                    const updatedProfile = { ...profile, goalWeight: newGoalWeight };
                    onProfileUpdate(updatedProfile);
                  }
                  setShowTDEESettings(false);
                }}
                className="w-full bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:from-accent-purple-dark hover:to-accent-purple-medium transition-all duration-300 shadow-theme hover:shadow-theme-lg transform hover:scale-[1.02]"
              >
                Save Profile
              </button> */}
            </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowTDEESettings(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (showDosageCalculator) {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-card-bg backdrop-blur-3xl rounded-2xl shadow-theme-lg max-w-md w-full mx-auto border border-card-border overflow-y-auto hide-scrollbar" style={{ maxHeight: '80vh' }}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-text-primary" style={{ textShadow: isDarkMode ? '0 0 20px rgba(177,156,217,0.6)' : '0 0 20px rgba(45,27,78,0.3)' }}>Dosage Calculator</h2>
              <button
                onClick={() => setShowDosageCalculator(false)}
                className="text-accent-purple-medium hover:text-accent-purple-light text-2xl leading-none p-1 rounded-lg hover:bg-accent-purple-light/10 transition-all duration-300"
                style={{ textShadow: isDarkMode ? '0 0 10px rgba(177,156,217,0.5)' : '0 0 10px rgba(45,27,78,0.2)' }}
              >
                ×
              </button>
            </div>
            <DosageCalculator onClose={() => setShowDosageCalculator(false)} />
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
<button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl hover:bg-accent-purple-light/10 transition-all duration-300 hover:shadow-theme"
        aria-label="Settings"
      >
        <svg
          className="w-6 h-6 text-text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ textShadow: isDarkMode ? '0 0 10px rgba(177,156,217,0.5)' : '0 0 10px rgba(45,27,78,0.3)' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {isOpen && (
          <div 
            className="absolute right-0 mt-3 w-56 rounded-2xl shadow-theme-lg border border-card-border py-2 z-40"
            style={{
              backgroundColor: 'var(--card-bg)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            } as React.CSSProperties}
          >
          <button
            onClick={handleTDEESettingsClick}
            className="w-full text-left px-4 py-3 text-text-muted hover:bg-accent-purple-light/10 transition-all duration-300 first:rounded-t-2xl hover:text-text-primary"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-accent-purple-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              User Settings
            </div>
          </button>
          
          <button
            onClick={handleDosageCalculatorClick}
            className="w-full text-left px-4 py-3 text-text-muted hover:bg-accent-purple-light/10 transition-all duration-300 hover:text-text-primary"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-accent-purple-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M12 14v4m0-4h.01M9 7h6m0-4h.01M12 3v4m0-4h.01" />
              </svg>
              Dosage Calculator
            </div>
          </button>
          
          
          
          <div className="border-t border-card-border mt-2 pt-2">
            <div className="px-4 py-3 flex items-center justify-between">
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
          </div>
      )}
      

    </div>
  );
};

export default SettingsDropdown;