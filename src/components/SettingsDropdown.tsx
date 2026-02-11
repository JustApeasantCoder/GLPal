import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { UserProfile } from '../types';
import TDEECalculator from './TDEECalculator';

interface SettingsDropdownProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
  profile,
  onProfileUpdate,
  isDarkMode,
  onThemeToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTDEESettings, setShowTDEESettings] = useState(false);
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

  if (showTDEESettings) {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(156,123,211,0.3)] max-w-md w-full mx-auto border border-[#9C7BD3]/20 overflow-y-auto" style={{ maxHeight: '80vh' }}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#4ADEA8] [text-shadow:0_0_20px_rgba(74,222,168,0.6)]">TDEE Settings</h2>
              <button
                onClick={() => setShowTDEESettings(false)}
                className="text-[#9C7BD3] hover:text-[#4ADEA8] text-2xl leading-none p-1 rounded-lg hover:bg-[#4ADEA8]/10 transition-all duration-300 [text-shadow:0_0_10px_rgba(74,222,168,0.5)]"
              >
                ×
              </button>
            </div>
            <TDEECalculator onProfileUpdate={onProfileUpdate} />
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
        className="p-2 rounded-xl hover:bg-[#4ADEA8]/10 transition-all duration-300 hover:shadow-[0_0_15px_rgba(74,222,168,0.3)]"
        aria-label="Settings"
      >
        <svg
          className="w-6 h-6 text-[#4ADEA8] [text-shadow:0_0_10px_rgba(74,222,168,0.5)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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
        <div className="absolute right-0 mt-3 w-56 bg-black/40 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_rgba(156,123,211,0.3)] border border-[#9C7BD3]/20 py-2 z-50">
          <button
            onClick={handleTDEESettingsClick}
            className="w-full text-left px-4 py-3 text-[#4ADEA8]/80 hover:bg-[#4ADEA8]/10 transition-all duration-300 first:rounded-t-2xl hover:text-[#4ADEA8]"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-[#9C7BD3] [text-shadow:0_0_5px_rgba(74,222,168,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              TDEE Settings
            </div>
          </button>
          
          <div className="border-t border-[#9C7BD3]/20 mt-2 pt-2">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-[#9C7BD3] [text-shadow:0_0_5px_rgba(74,222,168,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="text-[#4ADEA8]/80">Dark Mode</span>
              </div>
              <button
                onClick={onThemeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                  isDarkMode ? 'bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] shadow-[0_0_15px_rgba(74,222,168,0.4)]' : 'bg-gray-600/50'
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