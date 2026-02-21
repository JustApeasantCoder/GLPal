import React from 'react';
import { Peptide, PeptideLogEntry, PeptideCategory } from '../../../types';
import PeptideProgressBar from './PeptideProgressBar';
import { useTheme } from '../../../contexts/ThemeContext';

interface PeptideCardProps {
  peptide: Peptide;
  latestLog: PeptideLogEntry | null;
  currentTime: Date;
  onLog: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

const CATEGORY_LABELS: Record<PeptideCategory, string> = {
  healing: 'Healing',
  growth_hormone: 'GH',
  fat_loss: 'Fat Loss',
  muscle: 'Muscle',
  longevity: 'Longevity',
  immune: 'Immune',
  skin: 'Skin',
  cognitive: 'Cognitive',
  other: 'Other',
};

const ROUTE_ICONS: Record<string, string> = {
  subcutaneous: '💉',
  intramuscular: '💪',
  intravenous: '🩺',
  oral: '💊',
  topical: '🧴',
  intranasal: '👃',
  sublingual: '👅',
};

const PeptideCard: React.FC<PeptideCardProps> = ({
  peptide,
  latestLog,
  currentTime,
  onLog,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  const { isDarkMode } = useTheme();
  
  if (!peptide.isActive && peptide.isArchived) {
    return null;
  }

  return (
    <div 
      className={`rounded-2xl p-4 border transition-all duration-300 ${
        peptide.isActive 
          ? isDarkMode
            ? 'bg-black/30 border-[#B19CD9]/20 hover:border-[#B19CD9]/40'
            : 'bg-white border-gray-200 hover:border-gray-300'
          : isDarkMode
            ? 'bg-black/20 border-gray-700/50 opacity-60'
            : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: peptide.color }}
          />
          <div>
            <h3 className="font-semibold text-white">{peptide.name}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span 
                className="px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${peptide.color}20`, color: peptide.color }}
              >
                {CATEGORY_LABELS[peptide.category]}
              </span>
              <span>{peptide.dose}{peptide.doseUnit}</span>
              <span>{ROUTE_ICONS[peptide.route]}</span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-1">
          <button
            onClick={onToggleActive}
            className={`p-1.5 rounded-lg transition-colors ${
              peptide.isActive 
                ? 'text-green-400 hover:bg-green-400/20' 
                : 'text-gray-500 hover:bg-gray-500/20'
            }`}
            title={peptide.isActive ? 'Active' : 'Inactive'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {peptide.isActive ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-400/20 hover:text-red-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <PeptideProgressBar 
          peptide={peptide}
          latestLog={latestLog}
          currentTime={currentTime}
          color={peptide.color}
        />
      </div>

      {/* Log Button */}
      {peptide.isActive && (
        <button
          onClick={onLog}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white font-semibold hover:shadow-[0_0_20px_rgba(74,222,168,0.5)] transition-all"
        >
          Log
        </button>
      )}

      {/* Notes Preview */}
      {peptide.notes && (
        <p className="mt-2 text-xs text-gray-500 line-clamp-2">{peptide.notes}</p>
      )}
    </div>
  );
};

export default PeptideCard;
