import React, { useState, useEffect, useMemo } from 'react';
import { useThemeStyles } from '../../contexts/ThemeContext';
import { useTime } from '../../shared/hooks';
import { Peptide, PeptideLogEntry, PeptideCategory } from '../../types';
import { 
  getPeptides, 
  savePeptides, 
  addPeptide as dbAddPeptide, 
  updatePeptide as dbUpdatePeptide, 
  deletePeptide as dbDeletePeptide,
  addPeptideLog,
  getPeptideLogsById,
  getLatestPeptideLog,
  deletePeptideLog,
  addMedicationManualEntry 
} from '../../shared/utils/database';
import { timeService } from '../../core/timeService';
import PeptideModal from './components/PeptideModal';
import LogPeptideModal from './components/LogPeptideModal';
import PeptideCard from './components/PeptideCard';
import PeptideChart from './components/PeptideChart';

interface PeptidesTabProps {
  useWheelForDate?: boolean;
}

const CATEGORY_TABS: { id: PeptideCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'healing', label: 'Healing' },
  { id: 'growth_hormone', label: 'GH' },
  { id: 'fat_loss', label: 'Fat Loss' },
  { id: 'muscle', label: 'Muscle' },
  { id: 'longevity', label: 'Longevity' },
  { id: 'immune', label: 'Immune' },
  { id: 'skin', label: 'Skin' },
  { id: 'cognitive', label: 'Cognitive' },
  { id: 'other', label: 'Other' },
];

const PeptidesTab: React.FC<PeptidesTabProps> = ({ useWheelForDate = true }) => {
  const { bigCard, bigCardText, smallCard, text, isDarkMode } = useThemeStyles();
  const now = useTime(100);
  const currentTime = useMemo(() => new Date(now), [now]);
  
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PeptideCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingPeptide, setEditingPeptide] = useState<Peptide | null>(null);
  const [selectedPeptide, setSelectedPeptide] = useState<Peptide | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(() => {
    return localStorage.getItem('glpal_expanded_peptide_card');
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleteClosing, setIsDeleteClosing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (expandedCard) {
      localStorage.setItem('glpal_expanded_peptide_card', expandedCard);
    } else {
      localStorage.removeItem('glpal_expanded_peptide_card');
    }
  }, [expandedCard]);

  // Load peptides on mount
  useEffect(() => {
    const loaded = getPeptides();
    setPeptides(loaded);
  }, []);

  useEffect(() => {
    if (deleteConfirm) {
      document.body.classList.add('modal-open');
    } else if (document.body.classList.contains('modal-open')) {
      document.body.classList.remove('modal-open');
    }
  }, [deleteConfirm]);

  const handleCloseDeleteConfirm = () => {
    setIsDeleteClosing(true);
    setTimeout(() => {
      setDeleteConfirm(null);
      setIsDeleteClosing(false);
    }, 200);
  };

  const filteredPeptides = useMemo(() => {
    let filtered = peptides;
    
    if (!showArchived) {
      filtered = filtered.filter(p => !p.isArchived);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    return filtered.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [peptides, selectedCategory, showArchived]);

  const activePeptides = peptides.filter(p => p.isActive && !p.isArchived);
  const archivedPeptides = peptides.filter(p => p.isArchived);

  const handleAddPeptide = (peptide: Peptide) => {
    dbAddPeptide(peptide);
    setPeptides(getPeptides());
  };

  const handleUpdatePeptide = (peptide: Peptide) => {
    dbUpdatePeptide(peptide);
    setPeptides(getPeptides());
    setEditingPeptide(null);
  };

  const handleDeletePeptide = (id: string) => {
    dbDeletePeptide(id);
    setPeptides(getPeptides());
    setDeleteConfirm(null);
  };

  const handleToggleActive = (peptide: Peptide) => {
    const updated = { ...peptide, isActive: !peptide.isActive };
    dbUpdatePeptide(updated);
    setPeptides(getPeptides());
  };

  const handleArchivePeptide = (peptide: Peptide) => {
    const updated = { ...peptide, isArchived: true, isActive: false };
    dbUpdatePeptide(updated);
    setPeptides(getPeptides());
  };

  const handleLogInjection = (log: PeptideLogEntry) => {
    addPeptideLog(log);
    setShowLogModal(false);
    setSelectedPeptide(null);
  };

  const openLogModal = (peptide: Peptide) => {
    setSelectedPeptide(peptide);
    setShowLogModal(true);
  };

  return (
    <div className="space-y-3">
      <div className={bigCard}>
        <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>
          Peptides
        </h1>

        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-3 -mx-2 px-2 hide-scrollbar">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === tab.id 
                  ? 'bg-[#B19CD9] text-white' 
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className={smallCard}>
            <p className={text.label}>Active</p>
            <p className={text.value}>{activePeptides.length}</p>
          </div>
          <div className={smallCard}>
            <p className={text.label}>Archived</p>
            <p className={text.value}>{archivedPeptides.length}</p>
          </div>
          <div className={smallCard}>
            <p className={text.label}>Total Logs</p>
            <p className={text.value}>
              {peptides.reduce((sum, p) => sum + getPeptideLogsById(p.id).length, 0)}
            </p>
          </div>
        </div>

        {/* Peptide Cards */}
        {filteredPeptides.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💉</div>
            <p className="text-gray-400 mb-4">No peptides yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#B19CD9] to-[#D4B8E8] text-white font-medium text-sm hover:shadow-lg hover:shadow-[#B19CD9]/30 transition-all"
            >
              Add Your First Peptide
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPeptides.map(peptide => {
              const latestLog = getLatestPeptideLog(peptide.id);
              const logs = getPeptideLogsById(peptide.id);
              const isExpanded = expandedCard === peptide.id;
              
              return (
                <div key={peptide.id}>
                  <PeptideCard
                    peptide={peptide}
                    latestLog={latestLog}
                    currentTime={currentTime}
                    onLog={() => openLogModal(peptide)}
                    onEdit={() => setEditingPeptide(peptide)}
                    onDelete={() => setDeleteConfirm(peptide.id)}
                    onToggleActive={() => handleToggleActive(peptide)}
                  />
                  
                  {/* Expanded Chart View */}
                  {isExpanded && logs.length > 0 && (
                    <div className={`mt-2 p-3 rounded-xl border ${
                      isDarkMode 
                        ? 'bg-black/20 border-[#B19CD9]/10' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-white">{peptide.name} - Injection History</h4>
                        <button
                          onClick={() => setExpandedCard(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <PeptideChart logs={logs} color={peptide.color} height={150} />
                      
                      {/* Recent Logs */}
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-gray-500">Recent Logs:</p>
                        {logs.slice(0, 5).map(log => (
                          <div key={log.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/5">
                            <span className="text-gray-300">{log.date} {log.time}</span>
                            <span className="text-[#4ADEA8]">{log.dose}{log.doseUnit}</span>
                            <span className="text-gray-500">{log.injectionSite}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Button */}
        {filteredPeptides.length > 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-[#B19CD9]/30 text-[#B19CD9] font-medium hover:border-[#B19CD9]/60 hover:bg-[#B19CD9]/5 transition-all"
          >
            + Add Peptide
          </button>
        )}
      </div>

      {/* Add/Edit Modal */}
      <PeptideModal
        isOpen={showAddModal || editingPeptide !== null}
        onClose={() => {
          setShowAddModal(false);
          setEditingPeptide(null);
        }}
        onSave={editingPeptide ? handleUpdatePeptide : handleAddPeptide}
        editPeptide={editingPeptide}
        useWheelForDate={useWheelForDate}
      />

      {/* Log Injection Modal */}
      <LogPeptideModal
        isOpen={showLogModal}
        onClose={() => {
          setShowLogModal(false);
          setSelectedPeptide(null);
        }}
        onSave={handleLogInjection}
        peptide={selectedPeptide}
        useWheelForDate={useWheelForDate}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className={`fixed inset-0 bg-black/60 ${isDeleteClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`} onClick={() => setDeleteConfirm(null)} />
          <div className={`relative bg-gradient-to-b from-[#1a1625]/98 to-[#0d0a15]/98 rounded-2xl shadow-2xl border border-red-500/30 w-full max-w-sm p-6 ${isDeleteClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
            <h3 className="text-lg font-bold text-white mb-2">Delete Peptide?</h3>
            <p className="text-sm text-gray-400 mb-4">
              This will permanently delete this peptide and all its injection logs. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCloseDeleteConfirm}
                className="flex-1 py-2 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { handleCloseDeleteConfirm(); handleDeletePeptide(deleteConfirm); }}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeptidesTab;
