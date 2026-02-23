import React from 'react';
import { GLP1Protocol } from '../../../types';
import { MEDICATIONS, formatDateShort, formatFrequency } from '../../../constants/medications';
import { useTheme } from '../../../contexts/ThemeContext';

interface ProtocolListProps {
  protocols: GLP1Protocol[];
  collapsedMedications: Set<string>;
  onToggleMedication: (medicationName: string) => void;
  onEditProtocol: (protocol: GLP1Protocol) => void;
  onDeleteClick: (medicationName: string) => void;
}

interface GroupedProtocols {
  [medicationName: string]: GLP1Protocol[];
}

const ProtocolList: React.FC<ProtocolListProps> = ({
  protocols,
  collapsedMedications,
  onToggleMedication,
  onEditProtocol,
  onDeleteClick,
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
    <div className="space-y-3 mb-4">
      {Object.entries(groupedProtocols).map(([medicationName, medProtocols]) => {
        const isExpanded = !collapsedMedications.has(medicationName);
        return (
          <div 
            key={medicationName}
            className={`rounded-lg p-3 border ${
              isDarkMode 
                ? 'bg-black/20 border-[#B19CD9]/20' 
                : 'bg-gray-50 border-gray-200'
            }`}
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
            {isExpanded && (
              <div className="space-y-1">
                {medProtocols.map((protocol, index) => (
                  <div key={protocol.id}>
                    <div className="flex items-start justify-between gap-2 py-2">
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
                      <div className="flex items-center gap-2">
                        <span className={`text-sm whitespace-nowrap ${isDarkMode ? 'text-text-muted' : 'text-gray-600'}`}>
                          {formatDateShort(protocol.startDate)} → {protocol.stopDate ? formatDateShort(protocol.stopDate) : 'Ongoing'}
                        </span>
                        <button
                          onClick={() => onEditProtocol(protocol)}
                          className="text-sm text-accent-purple-light hover:text-accent-purple-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    {index < medProtocols.length - 1 && (
                      <div className={`border-b ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => onDeleteClick(medicationName)}
                  className={`mt-2 px-2 py-1 text-xs border rounded transition-all ${
                    isDarkMode
                      ? 'text-red-400 hover:text-red-500 border-red-500/30 hover:bg-red-500/10'
                      : 'text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50'
                  }`}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProtocolList;
