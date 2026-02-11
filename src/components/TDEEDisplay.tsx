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
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">BMR (Basal Metabolic Rate)</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{bmr.toLocaleString()} cal/day</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">TDEE (Total Daily Energy)</p>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-300">{tdee.toLocaleString()} cal/day</p>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Weight Loss Calorie Targets</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-300">Maintain weight</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current maintenance</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 dark:text-gray-300">{tdee.toLocaleString()} cal/day</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">No deficit</p>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div>
              <p className="font-medium text-green-900 dark:text-green-300">Loss 0.5 kg/week</p>
              <p className="text-sm text-green-600 dark:text-green-400">Slow and sustainable</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-900 dark:text-green-300">{loss05KgPerWeek.toLocaleString()} cal/day</p>
              <p className="text-sm text-green-600 dark:text-green-400">{deficit05Kg.toLocaleString()} cal deficit</p>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-300">Loss 1 kg/week</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Moderate pace</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-yellow-900 dark:text-yellow-300">{loss1KgPerWeek.toLocaleString()} cal/day</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">{deficit1Kg.toLocaleString()} cal deficit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Based on Current Weight: {currentWeight} kg</h4>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          These calculations use the Mifflin-St Jeor equation, considered the most accurate BMR formula.
          Individual results may vary based on body composition and genetics.
        </p>
      </div>
    </div>
  );
};

export default TDEEDisplay;