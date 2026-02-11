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
            <label htmlFor="age" className="block text-sm font-medium text-accent-purple-light mb-1">
              Age
            </label>
            <input
              type="number"
              id="age"
              min="1"
              max="120"
              value={profile.age}
              onChange={(e) => setProfile(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-accent-purple-light/30 bg-card-bg backdrop-blur-sm text-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium placeholder-text-muted transition-all duration-300"
              required
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-accent-purple-light mb-1">
              Gender
            </label>
            <select
              id="gender"
              value={profile.gender}
              onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
              className="w-full px-3 py-2 border border-accent-purple-light/30 bg-card-bg backdrop-blur-sm text-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-mint focus:border-accent-mint transition-all duration-300"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label htmlFor="height" className="block text-sm font-medium text-accent-purple-light mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              id="height"
              min="50"
              max="250"
              value={profile.height}
              onChange={(e) => setProfile(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-accent-purple-light/30 bg-card-bg backdrop-blur-sm text-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-medium focus:border-accent-purple-medium placeholder-text-muted transition-all duration-300"
              required
            />
          </div>

          <div>
            <label htmlFor="activity" className="block text-sm font-medium text-accent-purple-light mb-1">
              Activity Level
            </label>
            <select
              id="activity"
              value={profile.activityLevel}
              onChange={(e) => setProfile(prev => ({ ...prev, activityLevel: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-accent-purple-light/30 bg-card-bg backdrop-blur-sm text-text-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-mint focus:border-accent-mint transition-all duration-300"
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
          className="w-full bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:from-accent-purple-dark hover:to-accent-purple-medium transition-all duration-300 shadow-theme hover:shadow-theme-lg transform hover:scale-[1.02]"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
};

export default TDEECalculator;