import React from 'react';
import { calculateBMR, calculateTDEE } from '../utils/calculations';
import { UserProfile } from '../types';

interface TDEEDisplayProps {
  profile: UserProfile;
  currentWeight: number;
}

const TDEEDisplay: React.FC<TDEEDisplayProps> = ({ profile, currentWeight }) => {
  const bmr = calculateBMR(profile, currentWeight);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  
  // Calculate weekly weight loss scenarios
  const deficit05Kg = Math.round(7700 * 0.5 / 7); // ~550 cal deficit for 0.5kg/week
  const deficit1Kg = Math.round(7700 * 1.0 / 7); // ~1100 cal deficit for 1kg/week
  const loss05KgPerWeek = Math.round(tdee - deficit05Kg);
  const loss1KgPerWeek = Math.round(tdee - deficit1Kg);
  
  return (
    <div className="space-y-4">
      <div className="border-t border-card-border pt-4">
        <h4 className="font-medium text-text-primary mb-3" style={{ textShadow: '0 0 10px var(--accent-purple-light)' }}>Weight Loss Calorie Targets</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-accent-purple-light/20 to-accent-purple-medium/20 backdrop-blur-sm rounded-xl border border-accent-purple-light/30 hover:border-accent-purple-light/50 transition-all duration-300">
            <div>
              <p className="font-medium text-accent-purple-light">Maintain weight</p>
              <p className="text-sm text-text-muted">Current maintenance</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-text-secondary" style={{ textShadow: '0 0 5px var(--accent-purple-light)' }}>{tdee.toLocaleString()} cal/day</p>
              <p className="text-sm text-text-muted">No deficit</p>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-accent-purple-light/20 to-accent-purple-medium/20 backdrop-blur-sm rounded-xl border border-accent-purple-light/30 shadow-theme hover:border-accent-purple-light/50 transition-all duration-300">
            <div>
              <p className="font-medium text-accent-purple-light">Loss 0.5 kg/week</p>
              <p className="text-sm text-text-muted">Slow and sustainable</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-text-secondary" style={{ textShadow: '0 0 5px var(--accent-purple-light)' }}>{loss05KgPerWeek.toLocaleString()} cal/day</p>
              <p className="text-sm text-text-muted">{deficit05Kg.toLocaleString()} cal deficit</p>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-accent-purple-light/20 to-accent-purple-medium/20 backdrop-blur-sm rounded-xl border border-accent-purple-light/30 shadow-theme hover:border-accent-purple-light/50 transition-all duration-300">
            <div>
              <p className="font-medium text-accent-purple-light">Loss 1 kg/week</p>
              <p className="text-sm text-text-muted">Moderate pace</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-text-secondary" style={{ textShadow: '0 0 5px var(--accent-purple-light)' }}>{loss1KgPerWeek.toLocaleString()} cal/day</p>
              <p className="text-sm text-text-muted">{deficit1Kg.toLocaleString()} cal deficit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-card-border pt-4">
        <h4 className="font-medium text-text-primary mb-2" style={{ textShadow: '0 0 10px var(--accent-purple-light)' }}>Based on Current Weight: {currentWeight} kg</h4>
        <p className="text-xs text-text-muted">
          These calculations use the Mifflin-St Jeor equation, considered the most accurate BMR formula.
          Individual results may vary based on body composition and genetics.
        </p>
      </div>
    </div>
  );
};

export default TDEEDisplay;