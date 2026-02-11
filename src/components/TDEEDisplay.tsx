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
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#5B4B8A]/20 to-[#2F2A4A]/20 backdrop-blur-sm p-4 rounded-xl border border-[#5B4B8A]/30 shadow-[0_0_20px_rgba(91,75,138,0.2)]">
          <p className="text-sm text-[#5B4B8A] font-medium">BMR (Basal Metabolic Rate)</p>
          <p className="text-xl font-bold text-white [text-shadow:0_0_10px_rgba(91,75,138,0.5)]">{bmr.toLocaleString()} cal/day</p>
        </div>
        
        <div className="bg-gradient-to-br from-[#4ADEA8]/20 to-[#4FD99C]/20 backdrop-blur-sm p-4 rounded-xl border border-[#4ADEA8]/30 shadow-[0_0_20px_rgba(74,222,168,0.3)]">
          <p className="text-sm text-[#4ADEA8] font-medium">TDEE (Total Daily Energy)</p>
          <p className="text-xl font-bold text-white [text-shadow:0_0_10px_rgba(74,222,168,0.5)]">{tdee.toLocaleString()} cal/day</p>
        </div>
      </div>

      <div className="border-t border-[#9C7BD3]/20 pt-4">
        <h4 className="font-medium text-[#4ADEA8] mb-3 [text-shadow:0_0_10px_rgba(74,222,168,0.4)]">Weight Loss Calorie Targets</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#5B4B8A]/20 to-[#2F2A4A]/20 backdrop-blur-sm rounded-xl border border-[#5B4B8A]/30 hover:border-[#9C7BD3]/40 transition-all duration-300">
            <div>
              <p className="font-medium text-[#9C7BD3]">Maintain weight</p>
              <p className="text-sm text-[#5B4B8A]">Current maintenance</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-white [text-shadow:0_0_5px_rgba(91,75,138,0.5)]">{tdee.toLocaleString()} cal/day</p>
              <p className="text-sm text-[#5B4B8A]">No deficit</p>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#9C7BD3]/20 to-[#5B4B8A]/20 backdrop-blur-sm rounded-xl border border-[#9C7BD3]/30 shadow-[0_0_20px_rgba(156,123,211,0.3)] hover:border-[#4ADEA8]/50 transition-all duration-300">
            <div>
              <p className="font-medium text-[#4ADEA8]">Loss 0.5 kg/week</p>
              <p className="text-sm text-[#9C7BD3]">Slow and sustainable</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-white [text-shadow:0_0_5px_rgba(156,123,211,0.5)]">{loss05KgPerWeek.toLocaleString()} cal/day</p>
              <p className="text-sm text-[#9C7BD3]">{deficit05Kg.toLocaleString()} cal deficit</p>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#4ADEA8]/20 to-[#4FD99C]/20 backdrop-blur-sm rounded-xl border border-[#4ADEA8]/30 shadow-[0_0_20px_rgba(74,222,168,0.3)] hover:border-[#9C7BD3]/50 transition-all duration-300">
            <div>
              <p className="font-medium text-[#9C7BD3]">Loss 1 kg/week</p>
              <p className="text-sm text-[#4ADEA8]">Moderate pace</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-white [text-shadow:0_0_5px_rgba(74,222,168,0.5)]">{loss1KgPerWeek.toLocaleString()} cal/day</p>
              <p className="text-sm text-[#4ADEA8]">{deficit1Kg.toLocaleString()} cal deficit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#9C7BD3]/20 pt-4">
        <h4 className="font-medium text-[#4ADEA8] mb-2 [text-shadow:0_0_10px_rgba(74,222,168,0.4)]">Based on Current Weight: {currentWeight} kg</h4>
        <p className="text-xs text-[#5B4B8A]">
          These calculations use the Mifflin-St Jeor equation, considered the most accurate BMR formula.
          Individual results may vary based on body composition and genetics.
        </p>
      </div>
    </div>
  );
};

export default TDEEDisplay;