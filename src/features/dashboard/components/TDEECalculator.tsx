import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../../types';
import { convertHeightFromCm, convertHeightToCm, feetInchesToCm } from '../../../shared/utils/unitConversion';
import NumberPickerModal from '../../../shared/components/NumberPickerModal';
import BottomSheetModal from '../../../shared/components/BottomSheetModal';
import { useTheme } from '../../../contexts/ThemeContext';

interface TDEECalculatorProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  useWheelForNumbers?: boolean;
}

const TDEECalculator: React.FC<TDEECalculatorProps> = ({ profile: initialProfile, onProfileUpdate, useWheelForNumbers = true }) => {
  const { isDarkMode } = useTheme();
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [showAgePicker, setShowAgePicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);

  // Sync local state with parent profile when it changes (including unit system changes)
  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  // Update parent whenever local profile changes
  const handleChange = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  };

  const unitSystem = profile.unitSystem || 'metric';
  const { value: heightDisplayValue } = convertHeightFromCm(profile.height, unitSystem);

  // For better UX in imperial mode, also track feet and inches separately
  const [feet, inches] = unitSystem === 'imperial' 
    ? [Math.floor(heightDisplayValue / 12), Math.round(heightDisplayValue % 12)]
    : [0, 0];

const activityLevels = [
    { value: 1.2, label: 'Sedentary (Little or No Exercise)' },
    { value: 1.375, label: 'Lightly Active (1-3 Days/Week)' },
    { value: 1.55, label: 'Moderately Active (3-5 Days/Week)' },
    { value: 1.725, label: 'Very Active (6-7 Days/Week)' },
    { value: 1.9, label: 'Extremely Active (Physical Job)' },
  ];

return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
            Age
          </label>
          {useWheelForNumbers ? (
            <button
              type="button"
              onClick={() => setShowAgePicker(true)}
              className={`w-full px-3 py-2 border rounded-lg text-left transition-all ${
                isDarkMode
                  ? 'border-[#B19CD9]/50 bg-black/40 text-[#B19CD9]'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              {profile.age || 'Select age'}
            </button>
          ) : (
            <input
              type="number"
              value={profile.age || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                handleChange({ ...profile, age: value });
              }}
              className={`w-full px-3 py-2 border rounded-lg transition-all ${
                isDarkMode
                  ? 'border-[#B19CD9]/50 bg-black/40 text-[#B19CD9] placeholder-[#B19CD9]/50'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
              }`}
              placeholder="Enter age"
            />
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
            Gender
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleChange({ ...profile, gender: 'male' })}
              className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                profile.gender === 'male'
                  ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                  : isDarkMode
                    ? 'bg-black/40 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => handleChange({ ...profile, gender: 'female' })}
              className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                profile.gender === 'female'
                  ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                  : isDarkMode
                    ? 'bg-black/40 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Female
            </button>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
            Height ({unitSystem === 'imperial' ? 'ft/in' : 'cm'})
          </label>
          {useWheelForNumbers ? (
            <button
              type="button"
              onClick={() => setShowHeightPicker(true)}
              className={`w-full px-3 py-2 border rounded-lg text-left transition-all ${
                isDarkMode
                  ? 'border-[#B19CD9]/50 bg-black/40 text-[#B19CD9]'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              {unitSystem === 'imperial' 
                ? `${Math.floor(heightDisplayValue / 12)}'${Math.round(heightDisplayValue % 12)}"`
                : `${Math.round(heightDisplayValue)} cm`
              }
            </button>
          ) : (
            <input
              type="number"
              value={unitSystem === 'imperial' ? Math.round(heightDisplayValue) : Math.round(profile.height || 170)}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                let heightCm: number;
                if (unitSystem === 'imperial') {
                  heightCm = feetInchesToCm(Math.floor(value / 12), value % 12);
                } else {
                  heightCm = value;
                }
                if (heightCm && heightCm > 0) {
                  handleChange({ ...profile, height: heightCm });
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg transition-all ${
                isDarkMode
                  ? 'border-[#B19CD9]/50 bg-black/40 text-[#B19CD9] placeholder-[#B19CD9]/50'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
              }`}
              placeholder={unitSystem === 'imperial' ? 'Enter height (inches)' : 'Enter height (cm)'}
            />
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
            Units
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleChange({ ...profile, unitSystem: 'metric' })}
              className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                (profile.unitSystem || 'metric') === 'metric'
                  ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                  : isDarkMode
                    ? 'bg-black/40 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Metric
            </button>
            <button
              type="button"
              onClick={() => handleChange({ ...profile, unitSystem: 'imperial' })}
              className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                profile.unitSystem === 'imperial'
                  ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                  : isDarkMode
                    ? 'bg-black/40 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Imperial
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
          Activity Level
        </label>
        <button
          type="button"
          onClick={() => setShowActivityPicker(true)}
          className={`w-full px-3 py-2 border rounded-lg text-left transition-all ${
            isDarkMode
              ? 'border-[#B19CD9]/50 bg-black/40 text-[#B19CD9]'
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        >
          {activityLevels.find(l => l.value === profile.activityLevel)?.label || 'Select activity level'}
        </button>
      </div>

      <NumberPickerModal
        isOpen={showAgePicker}
        onSave={(value) => {
          const ageValue = parseInt(value);
          if (ageValue && ageValue > 0) {
            handleChange({ ...profile, age: ageValue });
          }
          setShowAgePicker(false);
        }}
        onClose={() => setShowAgePicker(false)}
        min={1}
        max={120}
        label="Age"
        decimals={0}
        defaultValue={String(profile.age || 30)}
      />

      <NumberPickerModal
        isOpen={showHeightPicker}
        onSave={(value) => {
          let heightCm: number;
          if (unitSystem === 'imperial' && value.includes("'")) {
            const match = value.match(/(\d+)'(\d+)"/);
            if (match) {
              heightCm = feetInchesToCm(parseInt(match[1]), parseInt(match[2]));
            } else {
              heightCm = parseFloat(value) || profile.height;
            }
          } else {
            heightCm = parseFloat(value);
          }
          if (heightCm && heightCm > 0) {
            handleChange({ ...profile, height: heightCm });
          }
          setShowHeightPicker(false);
        }}
        onClose={() => setShowHeightPicker(false)}
        min={unitSystem === 'imperial' ? 3 : 50}
        max={unitSystem === 'imperial' ? 8 : 250}
        label={unitSystem === 'imperial' ? "Height (ft/in)" : "Height (cm)"}
        decimals={0}
        defaultValue={unitSystem === 'imperial' 
          ? String(Math.floor(heightDisplayValue / 12)) 
          : String(Math.round(profile.height || 170))
        }
        secondaryMin={unitSystem === 'imperial' ? 0 : undefined}
        secondaryMax={unitSystem === 'imperial' ? 11 : undefined}
        secondaryDefaultValue={unitSystem === 'imperial' 
          ? String(Math.round(heightDisplayValue % 12)) 
          : undefined
        }
      />

      <BottomSheetModal
        isOpen={showActivityPicker}
        title="Activity Level"
        options={activityLevels}
        value={profile.activityLevel}
        onSelect={(val) => handleChange({ ...profile, activityLevel: parseFloat(String(val)) })}
        onClose={() => setShowActivityPicker(false)}
      />
    </div>
  );
};

export default TDEECalculator;