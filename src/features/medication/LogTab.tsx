import React, { useState, useEffect } from 'react';
import { GLP1Entry, GLP1Protocol } from '../../types';
import { getMedicationManualEntries, getMedicationProtocols } from '../../shared/utils/database';

const bigCard = "bg-black/30 backdrop-blur-lg rounded-2xl p-4 border border-[#9C7BD3]/20";
const bigCardText = {
  title: "text-lg font-bold text-text-primary mb-2"
};

interface LogTabProps {
  refreshKey?: number;
}

const LogTab: React.FC<LogTabProps> = ({ refreshKey }) => {
  const [manualEntries, setManualEntries] = useState<GLP1Entry[]>([]);
  const [protocols, setProtocols] = useState<GLP1Protocol[]>([]);

  useEffect(() => {
    const loadData = () => {
      const entries = getMedicationManualEntries();
      const prots = getMedicationProtocols();
      setManualEntries(entries.sort((a, b) => b.date.localeCompare(a.date)));
      setProtocols(prots);
    };
    loadData();
  }, [refreshKey]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const activeProtocol = protocols.find(p => {
    if (p.isArchived) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(p.startDate);
    const end = p.stopDate ? new Date(p.stopDate) : new Date('2099-12-31');
    return today >= start && today <= end;
  });

  return (
    <div className="space-y-3 pb-20">
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Dose Log</h1>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        {manualEntries.length === 0 ? (
          <p className="text-text-muted text-center py-8">No manually logged doses yet.</p>
        ) : (
          <div className="space-y-2">
            {manualEntries.map((entry) => (
              <div 
                key={entry.date}
                className="bg-black/20 rounded-lg p-3 border border-[#B19CD9]/20"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-text-primary font-medium">{formatDate(entry.date)}</p>
                    <p className="text-text-muted text-sm">{entry.medication}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#4ADEA8] font-bold">{entry.dose}mg</p>
                    {entry.isManual && (
                      <span className="text-xs text-[#B19CD9]">Manual</span>
                    )}
                  </div>
                </div>
                {(entry.time || entry.painLevel || entry.injectionSite || entry.isr) && (
                  <div className="border-t border-[#B19CD9]/10 pt-2 mt-2">
                    <div className="flex flex-wrap gap-2">
                      {entry.time && (
                        <span className="text-xs bg-[#B19CD9]/20 text-[#B19CD9] px-2 py-1 rounded">
                          {entry.time}
                        </span>
                      )}
                      {entry.painLevel !== undefined && entry.painLevel > 0 && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          entry.painLevel <= 3 ? 'bg-green-500/20 text-green-400' :
                          entry.painLevel <= 6 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          Pain: {entry.painLevel}/10
                        </span>
                      )}
                      {entry.injectionSite && (
                        <span className="text-xs bg-[#4ADEA8]/20 text-[#4ADEA8] px-2 py-1 rounded">
                          {entry.injectionSite}
                        </span>
                      )}
                      {entry.isr && entry.isr !== 'None' && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          entry.isr === 'Mild' ? 'bg-yellow-500/20 text-yellow-400' :
                          entry.isr === 'Moderate' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          ISR: {entry.isr}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {activeProtocol && (
        <div className={bigCard}>
          <h2 className="text-sm font-medium text-text-muted mb-2">Current Protocol</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-text-primary font-medium">{activeProtocol.medication}</p>
              <p className="text-text-muted text-sm">
                {activeProtocol.dose}mg • {activeProtocol.frequencyPerWeek}x per week
              </p>
            </div>
            <p className="text-[#4ADEA8] font-bold">{activeProtocol.dose}mg</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogTab;
