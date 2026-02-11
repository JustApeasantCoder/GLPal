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
        <div className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 backdrop-blur-sm p-4 rounded-xl border border-slate-600/30 shadow-[0_0_20px_rgba(148,163,184,0.2)]">
          <p className="text-sm text-slate-300 font-medium">BMR (Basal Metabolic Rate)</p>
          <p className="text-xl font-bold text-white [text-shadow:0_0_10px_rgba(148,163,184,0.5)]">{bmr.toLocaleString()} cal/day</p>
        </div>
        
        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm p-4 rounded-xl border border-cyan-400/30 shadow-[0_0_20px_rgba(0,255,255,0.3)]">
          <p className="text-sm text-cyan-300 font-medium">TDEE (Total Daily Energy)</p>
          <p className="text-xl font-bold text-white [text-shadow:0_0_10px_rgba(0,255,255,0.5)]">{tdee.toLocaleString()} cal/day</p>
        </div>
      </div>

      <div className="border-t border-cyan-500/20 pt-4">
        <h4 className="font-medium text-cyan-300 mb-3 [text-shadow:0_0_10px_rgba(0,255,255,0.4)]">Weight Loss Calorie Targets</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-600/20 to-slate-700/20 backdrop-blur-sm rounded-xl border border-slate-500/30 hover:border-slate-400/40 transition-all duration-300">
            <div>
              <p className="font-medium text-slate-200">Maintain weight</p>
              <p className="text-sm text-slate-400">Current maintenance</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-white [text-shadow:0_0_5px_rgba(148,163,184,0.5)]">{tdee.toLocaleString()} cal/day</p>
              <p className="text-sm text-slate-400">No deficit</p>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-sm rounded-xl border border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:border-emerald-400/50 transition-all duration-300">
            <div>
              <p className="font-medium text-emerald-200">Loss 0.5 kg/week</p>
              <p className="text-sm text-emerald-300">Slow and sustainable</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-white [text-shadow:0_0_5px_rgba(16,185,129,0.5)]">{loss05KgPerWeek.toLocaleString()} cal/day</p>
              <p className="text-sm text-emerald-300">{deficit05Kg.toLocaleString()} cal deficit</p>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl border border-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:border-amber-400/50 transition-all duration-300">
            <div>
              <p className="font-medium text-amber-200">Loss 1 kg/week</p>
              <p className="text-sm text-amber-300">Moderate pace</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-white [text-shadow:0_0_5px_rgba(251,191,36,0.5)]">{loss1KgPerWeek.toLocaleString()} cal/day</p>
              <p className="text-sm text-amber-300">{deficit1Kg.toLocaleString()} cal deficit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-cyan-500/20 pt-4">
        <h4 className="font-medium text-cyan-300 mb-2 [text-shadow:0_0_10px_rgba(0,255,255,0.4)]">Based on Current Weight: {currentWeight} kg</h4>
        <p className="text-xs text-slate-400">
          These calculations use the Mifflin-St Jeor equation, considered the most accurate BMR formula.
          Individual results may vary based on body composition and genetics.
        </p>
      </div>
    </div>
  );
};

export default TDEEDisplay;