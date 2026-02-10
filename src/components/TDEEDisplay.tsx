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
  const loss05KgPerWeek = Math.round(tdee - 550); // ~0.5kg/week deficit
  const loss1KgPerWeek = Math.round(tdee - 1100); // ~1kg/week deficit
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Your Metabolic Profile</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">BMR (Basal Metabolic Rate)</p>
          <p className="text-xl font-bold text-gray-900">{bmr.toLocaleString()} cal/day</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600">TDEE (Total Daily Energy)</p>
          <p className="text-xl font-bold text-blue-900">{tdee.toLocaleString()} cal/day</p>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Weight Loss Calorie Targets</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <div>
              <p className="font-medium text-green-900">Loss 0.5 kg/week</p>
              <p className="text-sm text-green-600">Slow and sustainable</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-900">{loss05KgPerWeek.toLocaleString()} cal/day</p>
              <p className="text-sm text-green-600">{(tdee - loss05KgPerWeek).toLocaleString()} cal deficit</p>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
            <div>
              <p className="font-medium text-yellow-900">Loss 1 kg/week</p>
              <p className="text-sm text-yellow-600">Moderate pace</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-yellow-900">{loss1KgPerWeek.toLocaleString()} cal/day</p>
              <p className="text-sm text-yellow-600">{(tdee - loss1KgPerWeek).toLocaleString()} cal deficit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-2">Based on Current Weight: {currentWeight} kg</h4>
        <p className="text-sm text-gray-600">
          These calculations use the Mifflin-St Jeor equation, considered the most accurate BMR formula.
          Individual results may vary based on body composition and genetics.
        </p>
      </div>
    </div>
  );
};

export default TDEEDisplay;