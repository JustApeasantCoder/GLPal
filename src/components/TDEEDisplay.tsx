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
      <div className="border-t border-[#9C7BD3]/20 pt-4">
        <h4 className="font-medium text-[#B19CD9] mb-3 [text-shadow:0_0_10px_rgba(177,156,217,0.4)]">Weight Loss Calorie Targets</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm rounded-xl border border-[#B19CD9]/30 hover:border-[#B19CD9]/50 transition-all duration-300">
            <div>
              <p className="font-medium text-[#B19CD9]">Maintain weight</p>
              <p className="text-sm text-[#B19CD9]/80">Current maintenance</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-white [text-shadow:0_0_5px_rgba(177,156,217,0.5)]">{tdee.toLocaleString()} cal/day</p>
              <p className="text-sm text-[#B19CD9]/80">No deficit</p>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm rounded-xl border border-[#B19CD9]/30 shadow-[0_0_20px_rgba(177,156,217,0.3)] hover:border-[#B19CD9]/50 transition-all duration-300">
            <div>
              <p className="font-medium text-[#B19CD9]">Loss 0.5 kg/week</p>
              <p className="text-sm text-[#B19CD9]/80">Slow and sustainable</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-white [text-shadow:0_0_5px_rgba(177,156,217,0.5)]">{loss05KgPerWeek.toLocaleString()} cal/day</p>
              <p className="text-sm text-[#B19CD9]/80">{deficit05Kg.toLocaleString()} cal deficit</p>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm rounded-xl border border-[#B19CD9]/30 shadow-[0_0_20px_rgba(177,156,217,0.3)] hover:border-[#B19CD9]/50 transition-all duration-300">
            <div>
              <p className="font-medium text-[#B19CD9]">Loss 1 kg/week</p>
              <p className="text-sm text-[#B19CD9]/80">Moderate pace</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-white [text-shadow:0_0_5px_rgba(177,156,217,0.5)]">{loss1KgPerWeek.toLocaleString()} cal/day</p>
              <p className="text-sm text-[#B19CD9]/80">{deficit1Kg.toLocaleString()} cal deficit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#9C7BD3]/20 pt-4">
        <h4 className="font-medium text-[#B19CD9] mb-2 [text-shadow:0_0_10px_rgba(177,156,217,0.4)]">Based on Current Weight: {currentWeight} kg</h4>
        <p className="text-xs text-[#B19CD9]/80">
          These calculations use the Mifflin-St Jeor equation, considered the most accurate BMR formula.
          Individual results may vary based on body composition and genetics.
        </p>
      </div>
    </div>
  );
};

export default TDEEDisplay;