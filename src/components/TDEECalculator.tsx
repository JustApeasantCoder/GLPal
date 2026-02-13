import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { convertHeightFromCm, convertHeightToCm, feetInchesToCm } from '../utils/unitConversion';

interface TDEECalculatorProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
}

const TDEECalculator: React.FC<TDEECalculatorProps> = ({ profile: initialProfile, onProfileUpdate }) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

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
    { value: 1.2, label: 'Sedentary (little or no exercise)' },
    { value: 1.375, label: 'Lightly active (1-3 days/week)' },
    { value: 1.55, label: 'Moderately active (3-5 days/week)' },
    { value: 1.725, label: 'Very active (6-7 days/week)' },
    { value: 1.9, label: 'Extremely active (physical job)' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-accent-purple-light mb-1">
            Age
          </label>
          <input
            type="number"
            id="age"
            min="1"
            max="120"
            value={profile.age}
            onChange={(e) => handleChange({ ...profile, age: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium placeholder-text-muted transition-all duration-300"
required
            />
            {unitSystem === 'imperial' && (
              <p className="text-xs text-accent-purple-light mt-1">
                {/*{feet}'{inches}" ({Math.round(heightDisplayValue)} inches total)*/}
              </p>
            )}
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-accent-purple-light mb-1">
            Gender
          </label>
          <select
            id="gender"
            value={profile.gender}
            onChange={(e) => handleChange({ ...profile, gender: e.target.value as 'male' | 'female' })}
            className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium transition-all duration-300"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-accent-purple-light mb-1">
            Height ({unitSystem === 'imperial' ? 'ft/in' : 'cm'})
          </label>
          {unitSystem === 'imperial' ? (
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="3"
                  max="8"
                  value={feet}
                  onChange={(e) => {
                    const newFeet = parseInt(e.target.value) || 0;
                    const newInches = inches || 0;
                    const heightInCm = feetInchesToCm(newFeet, newInches);
                    handleChange({ ...profile, height: heightInCm });
                  }}
                  className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium placeholder-text-muted transition-all duration-300"
                  placeholder="Feet"
                  required
                />
                <p className="text-xs text-accent-purple-light mt-1">feet</p>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={inches}
                  onChange={(e) => {
                    const newInches = parseInt(e.target.value) || 0;
                    const newFeet = feet || 0;
                    const heightInCm = feetInchesToCm(newFeet, newInches);
                    handleChange({ ...profile, height: heightInCm });
                  }}
                  className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium placeholder-text-muted transition-all duration-300"
                  placeholder="Inches"
                  required
                />
                <p className="text-xs text-accent-purple-light mt-1">inches</p>
              </div>
            </div>
          ) : (
            <input
              type="number"
              id="height"
              min="50"
              max="250"
              value={Math.round(heightDisplayValue)}
              onChange={(e) => {
                const displayHeight = parseInt(e.target.value) || 0;
                const heightInCm = convertHeightToCm(displayHeight, unitSystem);
                handleChange({ ...profile, height: heightInCm });
              }}
              className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium placeholder-text-muted transition-all duration-300"
              placeholder="Enter height in cm"
              required
            />
          )}
        </div>

        <div>
          <label htmlFor="activity" className="block text-sm font-medium text-accent-purple-light mb-1">
            Activity Level
          </label>
          <select
            id="activity"
            value={profile.activityLevel}
            onChange={(e) => handleChange({ ...profile, activityLevel: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium transition-all duration-300"
          >
            {activityLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TDEECalculator;