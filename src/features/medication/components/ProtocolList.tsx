import React from 'react';
import { GLP1Protocol } from '../../../types';
import { MEDICATIONS, formatDateShort, formatFrequency } from '../../../constants/medications';

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
            className="bg-black/20 rounded-lg p-3 border border-[#B19CD9]/20"
          >
            <button 
              onClick={() => onToggleMedication(medicationName)}
              className="w-full flex items-center justify-between mb-2"
            >
              <div className="text-left">
                <p className="text-base font-medium text-text-primary">{medicationName}</p>
                <p className="text-sm text-text-muted">{formatFrequency(medProtocols[0].frequencyPerWeek)}</p>
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
                        <span className="text-sm font-medium text-text-primary whitespace-nowrap">
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
                        <span className="text-sm text-text-muted whitespace-nowrap">
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
                      <div className="border-b border-[#B19CD9]/20"></div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => onDeleteClick(medicationName)}
                  className="mt-2 px-2 py-1 text-xs text-red-400 hover:text-red-500 border border-red-500/30 rounded hover:bg-red-500/10 transition-all"
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
