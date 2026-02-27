import React from 'react';
import { GLP1Protocol } from '../../../types';
import { MEDICATIONS, formatDateShort, formatFrequency } from '../../../constants/medications';
import { useTheme } from '../../../contexts/ThemeContext';
import Collapse from '../../../shared/components/Collapse';

const GLP1_COLORS = [
  '#9C7BD3', // Semaglutide
  '#4ADEA8', // Tirzepatide
  '#F59E0B', // Retatrutide
  '#EF4444', // Cagrilintide
  '#3B82F6', // Liraglutide
  '#94A3B8', // Dulaglutide
  '#6B7280', // Custom/Other
];

const getMedicationColor = (medicationId: string): string => {
  const medIndex = MEDICATIONS.findIndex(m => m.id === medicationId);
  if (medIndex >= 0 && medIndex < GLP1_COLORS.length) {
    return GLP1_COLORS[medIndex];
  }
  return GLP1_COLORS[0];
};

interface ProtocolListProps {
  protocols: GLP1Protocol[];
  collapsedMedications: Set<string>;
  onToggleMedication: (medicationName: string) => void;
  onEditProtocol: (protocol: GLP1Protocol) => void;
}

interface GroupedProtocols {
  [medicationName: string]: GLP1Protocol[];
}

const ProtocolList: React.FC<ProtocolListProps> = ({
  protocols,
  collapsedMedications,
  onToggleMedication,
  onEditProtocol,
}) => {
  const { isDarkMode } = useTheme();
  if (protocols.length === 0) return null;

  const groupedProtocols = protocols.reduce((acc, protocol) => {
    const med = MEDICATIONS.find(m => m.id === protocol.medication);
    const medName = med?.name || protocol.medication;
    if (!acc[medName]) {
      acc[medName] = [];
    }
    acc[medName].push(protocol);
    return acc;
  }, {} as GroupedProtocols);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
      {Object.entries(groupedProtocols).map(([medicationName, medProtocols]) => {
        const isExpanded = !collapsedMedications.has(medicationName);
        const med = MEDICATIONS.find(m => m.name === medicationName);
        const medicationColor = med ? getMedicationColor(med.id) : GLP1_COLORS[0];
        
        return (
          <div 
            key={medicationName}
            className={`rounded-lg p-3 border ${
              isDarkMode 
                ? 'bg-black/20 border-[#B19CD9]/20' 
                : 'bg-gray-50 border-gray-200'
            }`}
            style={{ borderLeftWidth: '3px', borderLeftColor: medicationColor }}
          >
            <button 
              onClick={() => onToggleMedication(medicationName)}
              className="w-full flex items-center justify-between mb-2"
            >
              <div className="text-left">
                <p className={`text-base font-medium ${isDarkMode ? 'text-text-primary' : 'text-gray-900'}`}>{medicationName}</p>
                <p className={`text-sm ${isDarkMode ? 'text-text-muted' : 'text-gray-600'}`}>{formatFrequency(medProtocols[0].frequencyPerWeek)}</p>
              </div>
              <svg 
                className={`w-5 h-5 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <Collapse isOpen={isExpanded}>
              <div className="space-y-1">
                {medProtocols.map((protocol, index) => (
                  <div 
                    key={protocol.id}
                    onClick={() => onEditProtocol(protocol)}
                    className="flex items-start justify-between gap-2 py-2 cursor-pointer hover:bg-black/10 dark:hover:bg-white/5 rounded px-1 -mx-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium whitespace-nowrap ${isDarkMode ? 'text-text-primary' : 'text-gray-900'}`}>
                        {protocol.dose}mg
                      </span>
                      {protocol.phase === 'titrate' && (
                        <span className="text-[#4ADEA8]">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <span className={`text-sm whitespace-nowrap ${isDarkMode ? 'text-text-muted' : 'text-gray-600'}`}>
                      {formatDateShort(protocol.startDate)} → {protocol.stopDate ? formatDateShort(protocol.stopDate) : 'Ongoing'}
                    </span>
                  </div>
                ))}
              </div>
            </Collapse>
          </div>
        );
      })}
    </div>
  );
};

export default ProtocolList;
