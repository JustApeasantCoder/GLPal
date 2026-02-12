import React from 'react';
import { calculateBMR, calculateTDEE } from '../utils/calculations';
import { UserProfile } from '../types';
import { useThemeStyles } from '../contexts/ThemeContext';
import { formatWeight } from '../utils/unitConversion';

interface TDEEDisplayProps {
  profile: UserProfile;
  currentWeight: number;
}

const TDEEDisplay: React.FC<TDEEDisplayProps> = ({ profile, currentWeight }) => {
  const bmr = calculateBMR(profile, currentWeight);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const unitSystem = profile.unitSystem || 'metric';
  
  // Calculate weekly weight loss scenarios
  const weightLoss05 = unitSystem === 'imperial' ? 1.1 : 0.5; // 1.1 lbs or 0.5 kg
  const weightLoss1 = unitSystem === 'imperial' ? 2.2 : 1.0; // 2.2 lbs or 1.0 kg
  
  const deficit05Kg = Math.round(7700 * 0.5 / 7); // ~550 cal deficit for 0.5kg/week
  const deficit1Kg = Math.round(7700 * 1.0 / 7); // ~1100 cal deficit for 1kg/week
  const loss05KgPerWeek = Math.round(tdee - deficit05Kg);
  const loss1KgPerWeek = Math.round(tdee - deficit1Kg);
  
  const { bigCardText, tdeeCard, tdeeText } = useThemeStyles();
  
  return (
<div className="space-y-4">
  <div className="border-t border-card-border pt-4">
    <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>
      Weight Loss Calorie Targets
    </h1>

    <div className="space-y-2">
      {/* 0.5kg/week */}
      <div className={tdeeCard}>
        <div>
          <p className={tdeeText.label}>Loss {weightLoss05} {unitSystem === 'imperial' ? 'lbs' : 'kg'}/week</p>
          <p className={tdeeText.subtitle}>Gradual Pace</p>
        </div>
        <div className="text-right">
          <p className={tdeeText.value}>{loss05KgPerWeek.toLocaleString()} kcal/day</p>
          <p className={tdeeText.subtitle}>{deficit05Kg.toLocaleString()} kcal deficit</p>
        </div>
      </div>

      {/* 1kg/week */}
      <div className={tdeeCard}>
        <div>
          <p className={tdeeText.label}>Loss {weightLoss1} {unitSystem === 'imperial' ? 'lbs' : 'kg'}/week</p>
          <p className={tdeeText.subtitle}>Moderate Pace</p>
        </div>
        <div className="text-right">
          <p className={tdeeText.value}>{loss1KgPerWeek.toLocaleString()} kcal/day</p>
          <p className={tdeeText.subtitle}>{deficit1Kg.toLocaleString()} kcal deficit</p>
        </div>
      </div>

      {/* Maintenance */}
      <div className={tdeeCard}>
        <div>
          <p className={tdeeText.label}>Maintenance</p>
          <p className={tdeeText.subtitle}>Current maintenance</p>
        </div>
        <div className="text-right">
          <p className={tdeeText.value}>{tdee.toLocaleString()} cal/day</p>
          <p className={tdeeText.subtitle}>No deficit</p>
        </div>
      </div>
    </div>
  </div>

    {/* Info Section */}
    <div className="border-t border-card-border pt-4">
      <h4
        className={bigCardText.title}
        style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}
      >
        Based on Current Weight: {formatWeight(currentWeight, unitSystem)}
      </h4>
      <p className="text-xs text-text-muted">
        These calculations use the Mifflin-St Jeor equation, considered the most accurate BMR formula.
        Individual results may vary based on body composition and genetics.
      </p>
    </div>
  </div>
);
};

export default TDEEDisplay;