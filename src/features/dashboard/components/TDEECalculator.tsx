import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../../types';
import { convertHeightFromCm, feetInchesToCm } from '../../../shared/utils/unitConversion';
import NumberPickerModal from '../../../shared/components/NumberPickerModal';
import BottomSheetModal from '../../../shared/components/BottomSheetModal';
import { useTheme, useThemeStyles } from '../../../contexts/ThemeContext';

interface TDEECalculatorProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  useWheelForNumbers?: boolean;
  showGoalWeight?: boolean;
  onGoalWeightClick?: () => void;
}

const TDEECalculator: React.FC<TDEECalculatorProps> = ({ profile: initialProfile, onProfileUpdate, useWheelForNumbers = true, showGoalWeight = false, onGoalWeightClick }) => {
  const { isDarkMode } = useTheme();
  const { segmentButton, inputButton, input: inputStyle } = useThemeStyles();
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
              className={inputButton}
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
              className={inputStyle}
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
              className={segmentButton(profile.gender === 'male')}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => handleChange({ ...profile, gender: 'female' })}
              className={segmentButton(profile.gender === 'female')}
            >
              Female
            </button>
          </div>
        </div>

        {showGoalWeight ? (
          <div className="contents">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                Height ({unitSystem === 'imperial' ? 'ft / in' : 'cm'})
              </label>
              {useWheelForNumbers ? (
                <button
                  type="button"
                  onClick={() => setShowHeightPicker(true)}
                  className={inputButton}
                >
                  {unitSystem === 'imperial' 
                    ? `${Math.floor(heightDisplayValue / 12)}'${Math.round(heightDisplayValue % 12)}"`
                    : `${Math.round(heightDisplayValue)} cm`
                  }
                </button>
              ) : (
                unitSystem === 'imperial' ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={feet}
                      onChange={(e) => {
                        const feetVal = parseInt(e.target.value) || 0;
                        const heightCm = feetInchesToCm(feetVal, inches);
                        if (heightCm && heightCm > 0) {
                          handleChange({ ...profile, height: heightCm });
                        }
                      }}
                      className={inputStyle}
                      placeholder="ft"
                      min={0}
                      max={8}
                    />
                    <input
                      type="number"
                      value={inches}
                      onChange={(e) => {
                        const inchesVal = parseInt(e.target.value) || 0;
                        const heightCm = feetInchesToCm(feet, inchesVal);
                        if (heightCm && heightCm > 0) {
                          handleChange({ ...profile, height: heightCm });
                        }
                      }}
                      className={inputStyle}
                      placeholder="in"
                      min={0}
                      max={11}
                    />
                  </div>
                ) : (
                  <input
                    type="number"
                    value={Math.round(profile.height || 170)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      if (value && value > 0) {
                        handleChange({ ...profile, height: value });
                      }
                    }}
                    className={inputStyle}
                    placeholder="Enter height (cm)"
                  />
                )
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                Goal Weight ({unitSystem === 'imperial' ? 'lbs' : 'kg'})
              </label>
              <button
                type="button"
                onClick={onGoalWeightClick}
                className={inputButton}
              >
                {profile.goalWeight 
                  ? `${Math.round(convertHeightFromCm(profile.goalWeight, unitSystem).value)} ${convertHeightFromCm(profile.goalWeight, unitSystem).unit}`
                  : `Set goal weight`
                }
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              Height ({unitSystem === 'imperial' ? 'ft / in' : 'cm'})
            </label>
            {useWheelForNumbers ? (
              <button
                type="button"
                onClick={() => setShowHeightPicker(true)}
                className={inputButton}
              >
                {unitSystem === 'imperial' 
                  ? `${Math.floor(heightDisplayValue / 12)}'${Math.round(heightDisplayValue % 12)}"`
                  : `${Math.round(heightDisplayValue)} cm`
                }
              </button>
            ) : (
              unitSystem === 'imperial' ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={feet}
                    onChange={(e) => {
                      const feetVal = parseInt(e.target.value) || 0;
                      const heightCm = feetInchesToCm(feetVal, inches);
                      if (heightCm && heightCm > 0) {
                        handleChange({ ...profile, height: heightCm });
                      }
                    }}
                    className={inputStyle}
                    placeholder="ft"
                    min={0}
                    max={8}
                  />
                  <input
                    type="number"
                    value={inches}
                    onChange={(e) => {
                      const inchesVal = parseInt(e.target.value) || 0;
                      const heightCm = feetInchesToCm(feet, inchesVal);
                      if (heightCm && heightCm > 0) {
                        handleChange({ ...profile, height: heightCm });
                      }
                    }}
                    className={inputStyle}
                    placeholder="in"
                    min={0}
                    max={11}
                  />
                </div>
              ) : (
                <input
                  type="number"
                  value={Math.round(profile.height || 170)}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (value && value > 0) {
                      handleChange({ ...profile, height: value });
                    }
                  }}
                  className={inputStyle}
                  placeholder="Enter height (cm)"
                />
              )
            )}
          </div>
        )}
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
          Activity Level
        </label>
        <button
          type="button"
          onClick={() => setShowActivityPicker(true)}
          className={inputButton}
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