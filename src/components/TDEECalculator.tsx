import React, { useState } from 'react';
import { UserProfile } from '../types';

interface TDEECalculatorProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  onClose?: () => void;
}

const TDEECalculator: React.FC<TDEECalculatorProps> = ({ profile: initialProfile, onProfileUpdate, onClose }) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProfileUpdate(profile);
    if (onClose) {
      onClose();
    }
  };

  const activityLevels = [
    { value: 1.2, label: 'Sedentary (little or no exercise)' },
    { value: 1.375, label: 'Lightly active (1-3 days/week)' },
    { value: 1.55, label: 'Moderately active (3-5 days/week)' },
    { value: 1.725, label: 'Very active (6-7 days/week)' },
    { value: 1.9, label: 'Extremely active (physical job)' },
  ];

  return (
    <div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-[#9C7BD3] mb-1">
              Age
            </label>
            <input
              type="number"
              id="age"
              min="1"
              max="120"
              value={profile.age}
              onChange={(e) => setProfile(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-[#9C7BD3]/30 bg-black/30 backdrop-blur-sm text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4ADEA8] focus:border-[#4ADEA8] placeholder-gray-400 transition-all duration-300"
              required
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-[#9C7BD3] mb-1">
              Gender
            </label>
            <select
              id="gender"
              value={profile.gender}
              onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
              className="w-full px-3 py-2 border border-[#9C7BD3]/30 bg-black/30 backdrop-blur-sm text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4ADEA8] focus:border-[#4ADEA8] transition-all duration-300"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label htmlFor="height" className="block text-sm font-medium text-[#9C7BD3] mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              id="height"
              min="50"
              max="250"
              value={profile.height}
              onChange={(e) => setProfile(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-[#9C7BD3]/30 bg-black/30 backdrop-blur-sm text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4ADEA8] focus:border-[#4ADEA8] placeholder-gray-400 transition-all duration-300"
              required
            />
          </div>

          <div>
            <label htmlFor="activity" className="block text-sm font-medium text-[#9C7BD3] mb-1">
              Activity Level
            </label>
            <select
              id="activity"
              value={profile.activityLevel}
              onChange={(e) => setProfile(prev => ({ ...prev, activityLevel: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-[#9C7BD3]/30 bg-black/30 backdrop-blur-sm text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4ADEA8] focus:border-[#4ADEA8] transition-all duration-300"
            >
              {activityLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white py-2 px-4 rounded-lg hover:from-[#5B4B8A] hover:to-[#9C7BD3] transition-all duration-300 shadow-[0_0_20px_rgba(74,222,168,0.3)] hover:shadow-[0_0_30px_rgba(156,123,211,0.5)] transform hover:scale-[1.02]"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
};

export default TDEECalculator;