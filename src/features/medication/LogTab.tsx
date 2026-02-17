import React, { useState, useEffect } from 'react';
import { GLP1Entry, GLP1Protocol, SideEffect } from '../../types';
import { getMedicationManualEntries, getMedicationProtocols, saveMedicationManualEntries } from '../../shared/utils/database';

const bigCard = "bg-black/30 backdrop-blur-lg rounded-2xl p-4 border border-[#9C7BD3]/20";
const bigCardText = {
  title: "text-lg font-bold text-text-primary mb-2"
};

interface LogTabProps {
  refreshKey?: number;
}

const COMMON_SIDE_EFFECTS = [
  'Nausea',
  'Vomiting',
  'Diarrhea',
  'Constipation',
  'Abdominal Pain',
  'Headache',
  'Fatigue',
  'Dizziness',
  'Loss of Appetite',
  'Heartburn',
];

const LogTab: React.FC<LogTabProps> = ({ refreshKey }) => {
  const [manualEntries, setManualEntries] = useState<GLP1Entry[]>([]);
  const [protocols, setProtocols] = useState<GLP1Protocol[]>([]);
  const [editingEntry, setEditingEntry] = useState<GLP1Entry | null>(null);
  const [editSideEffects, setEditSideEffects] = useState<SideEffect[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [activeSideEffect, setActiveSideEffect] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      const entries = getMedicationManualEntries();
      const prots = getMedicationProtocols();
      setManualEntries(entries.sort((a, b) => b.date.localeCompare(a.date)));
      setProtocols(prots);
    };
    loadData();
  }, [refreshKey]);

  const addSideEffect = (name: string) => {
    setActiveSideEffect(name);
    setEditSideEffects([...editSideEffects, { name, severity: 5 }]);
  };

  const removeSideEffect = (name: string) => {
    setEditSideEffects(editSideEffects.filter(se => se.name !== name));
  };

  const updateSideEffectSeverity = (name: string, severity: number) => {
    setEditSideEffects(editSideEffects.map(se => 
      se.name === name ? { ...se, severity } : se
    ));
  };

  const handleSaveSideEffects = () => {
    if (!editingEntry) return;
    
    const updatedEntries = manualEntries.map(entry => 
      entry.date === editingEntry.date 
        ? { ...entry, sideEffects: editSideEffects.length > 0 ? editSideEffects : undefined, notes: editNotes || undefined }
        : entry
    );
    
    saveMedicationManualEntries(updatedEntries);
    setManualEntries(updatedEntries.sort((a, b) => b.date.localeCompare(a.date)));
    setEditingEntry(null);
  };

  const openSideEffectsEditor = (entry: GLP1Entry) => {
    setEditingEntry(entry);
    setEditSideEffects(entry.sideEffects || []);
    setEditNotes(entry.notes || '');
    setActiveSideEffect(null);
  };

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
                <div className="border-t border-[#B19CD9]/10 pt-2 mt-2">
                  <div className="flex flex-wrap gap-2 items-center">
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
                      {entry.sideEffects && entry.sideEffects.length > 0 && entry.sideEffects.map((se) => (
                        <span key={se.name} className={`text-xs px-2 py-1 rounded ${
                          se.severity <= 3 ? 'bg-green-500/20 text-green-400' :
                          se.severity <= 6 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {se.name} ({se.severity})
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {entry.notes && (
                    <div className="mt-2 pt-2 border-t border-[#B19CD9]/10">
                      <p className="text-xs text-text-muted">
                        <span className="text-text-primary">Notes:</span> {entry.notes}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => openSideEffectsEditor(entry)}
                      className="px-3 py-1 text-xs rounded-lg transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_10px_rgba(177,156,217,0.4)]"
                    >
                      + Add Side Effects / Notes
                    </button>
                  </div>
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

      {editingEntry && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" style={{ backdropFilter: 'blur(8px)' }} onClick={() => setEditingEntry(null)} />
          <div className="relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-2">Side Effects & Notes</h3>
            <p className="text-sm text-text-muted mb-4">{formatDate(editingEntry.date)} - {editingEntry.medication}</p>
            
            <div className="border-t border-[#B19CD9]/20 my-4"></div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Side Effects
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_SIDE_EFFECTS.filter(se => !editSideEffects.find(s => s.name === se)).map((se) => (
                    <button
                      key={se}
                      type="button"
                      onClick={() => addSideEffect(se)}
                      className="text-xs bg-black/20 border border-[#B19CD9]/30 text-[#B19CD9] px-2 py-1 rounded hover:bg-[#B19CD9]/20 hover:border-[#B19CD9]/50 transition-all"
                    >
                      + {se}
                    </button>
                  ))}
                </div>
                
                {editSideEffects.length > 0 && (
                  <div className="space-y-3">
                    {editSideEffects.map((se) => (
                      <div key={se.name} className="bg-black/20 rounded-lg p-3 border border-[#B19CD9]/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-text-primary font-medium">{se.name}</span>
                          <button
                            type="button"
                            onClick={() => removeSideEffect(se.name)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Mild</span>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={se.severity}
                            onChange={(e) => updateSideEffectSeverity(se.name, parseInt(e.target.value))}
                            className="pain-slider flex-1 h-10 appearance-none cursor-pointer"
                          />
                          <span className="text-xs text-gray-400">Severe</span>
                        </div>
                        <div className="text-center mt-1">
                          <span className={`text-xs font-medium ${
                            se.severity <= 3 ? 'text-green-400' :
                            se.severity <= 6 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {se.severity}/10
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t border-[#B19CD9]/20 my-4"></div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 bg-black/20 border border-[#B19CD9]/30 rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-[#B19CD9]/60 resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="border-t border-[#B19CD9]/20 my-4"></div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setEditingEntry(null)}
                className="flex-1 py-3 rounded-xl border border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSideEffects}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white font-medium hover:shadow-[0_0_20px_rgba(74,222,168,0.5)] transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogTab;
