import React, { useState, useEffect, useMemo } from 'react';
import { GLP1Entry, GLP1Protocol, SideEffect, WeightEntry, WeightMacros, UserProfile, PeptideLogEntry, Peptide } from '../../types';
import { getMedicationManualEntries, getMedicationProtocols, saveMedicationManualEntries, getWeightEntries, saveWeightEntries, getPeptideLogs, getPeptides } from '../../shared/utils/database';
import { getMedicationColorByName } from '../../shared/utils/chartUtils';
import { useThemeStyles } from '../../contexts/ThemeContext';
import { convertWeightFromKg, getWeightUnit } from '../../shared/utils/unitConversion';
import DoseWheelPickerModal from '../../shared/components/DoseWheelPickerModal';

interface LogTabProps {
  refreshKey?: number;
  profile?: UserProfile;
  useWheelForNumbers?: boolean;
}

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWeekKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  const weekStart = getWeekStart(date);
  return weekStart.toISOString().split('T')[0];
};

const getWeekLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const formatOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${weekStart.toLocaleDateString('en-US', formatOpts)} - ${weekEnd.toLocaleDateString('en-US', formatOpts)}`;
};

const getMonthKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

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

const LogTab: React.FC<LogTabProps> = ({ refreshKey, profile, useWheelForNumbers = true }) => {
  const { bigCard, isDarkMode } = useThemeStyles();
  const unitSystem = profile?.unitSystem || 'metric';
  const weightUnit = getWeightUnit(unitSystem);
  const bigCardText = {
    title: "text-lg font-bold text-text-primary mb-2"
  };
  const [manualEntries, setManualEntries] = useState<GLP1Entry[]>([]);
  const [protocols, setProtocols] = useState<GLP1Protocol[]>([]);
  const [editingEntry, setEditingEntry] = useState<GLP1Entry | null>(null);
  const [isDoseLogCollapsed, setIsDoseLogCollapsed] = useState(() => {
    const saved = localStorage.getItem('glpal_dose_log_collapsed');
    return saved === 'true';
  });
  const [sortBy, setSortBy] = useState<'date' | 'medication' | 'dose'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [isSideEffectsVisible, setIsSideEffectsVisible] = useState(false);
  const [isSideEffectsClosing, setIsSideEffectsClosing] = useState(false);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [isWeightLogCollapsed, setIsWeightLogCollapsed] = useState(() => {
    const saved = localStorage.getItem('glpal_weight_log_collapsed');
    return saved === 'true';
  });
  const [weightViewMode, setWeightViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [editingWeightEntry, setEditingWeightEntry] = useState<WeightEntry | null>(null);
  const [editWeightNotes, setEditWeightNotes] = useState('');
  const [editWeightMacros, setEditWeightMacros] = useState<WeightMacros>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [isWeightModalClosing, setIsWeightModalClosing] = useState(false);
  const [peptideLogs, setPeptideLogs] = useState<PeptideLogEntry[]>([]);
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [isPeptideLogCollapsed, setIsPeptideLogCollapsed] = useState(() => {
    const saved = localStorage.getItem('glpal_peptide_log_collapsed');
    return saved === 'true';
  });

  // Picker states
  const [showCaloriePicker, setShowCaloriePicker] = useState(false);
  const [showProteinPicker, setShowProteinPicker] = useState(false);
  const [showCarbsPicker, setShowCarbsPicker] = useState(false);
  const [showFatPicker, setShowFatPicker] = useState(false);

  const weeklyAverages = useMemo(() => {
    if (weightEntries.length === 0) return new Map<string, number>();
    
    const weekGroups = new Map<string, WeightEntry[]>();
    weightEntries.forEach(entry => {
      const key = getWeekKey(entry.date);
      if (!weekGroups.has(key)) {
        weekGroups.set(key, []);
      }
      weekGroups.get(key)!.push(entry);
    });
    
    const averages = new Map<string, number>();
    weekGroups.forEach((entries, weekKey) => {
      const sum = entries.reduce((acc, e) => acc + e.weight, 0);
      averages.set(weekKey, sum / entries.length);
    });
    
    return averages;
  }, [weightEntries]);

  const aggregatedWeightData = useMemo(() => {
    if (weightEntries.length === 0) return { data: [], prevChange: null };
    
    const sorted = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
    
    if (weightViewMode === 'daily') {
      const dailyWithChange = sorted.map((entry, idx) => {
        let change: number | null = null;
        if (idx > 0) {
          change = sorted[idx - 1].weight - entry.weight;
        }
        return { ...entry, change };
      });
      
      let prevChange: number | null = null;
      if (sorted.length >= 2) {
        prevChange = sorted[sorted.length - 2].weight - sorted[sorted.length - 1].weight;
      }
      
      return { data: dailyWithChange, prevChange };
    }
    
    if (weightViewMode === 'weekly') {
      const weekGroups = new Map<string, WeightEntry[]>();
      sorted.forEach(entry => {
        const key = getWeekKey(entry.date);
        if (!weekGroups.has(key)) weekGroups.set(key, []);
        weekGroups.get(key)!.push(entry);
      });
      
      const weekly: { date: string; avgWeight: number; weekLabel: string; change: number | null; macros: { calories: number; protein: number; carbs: number; fat: number } | null; hasNotes: boolean }[] = [];
      const sortedWeeks = Array.from(weekGroups.keys()).sort();
      
      sortedWeeks.forEach((weekKey, idx) => {
        const entries = weekGroups.get(weekKey)!;
        const sum = entries.reduce((acc, e) => acc + e.weight, 0);
        const avg = sum / entries.length;
        const prevAvg = idx > 0 ? weekly[idx - 1].avgWeight : null;
        const change = prevAvg !== null ? prevAvg - avg : null;
        
        const macrosSum = entries.reduce((acc, e) => ({
          calories: acc.calories + (e.macros?.calories || 0),
          protein: acc.protein + (e.macros?.protein || 0),
          carbs: acc.carbs + (e.macros?.carbs || 0),
          fat: acc.fat + (e.macros?.fat || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        
        const hasNotes = entries.some(e => e.notes);
        
        weekly.push({ 
          date: weekKey, 
          avgWeight: avg, 
          weekLabel: getWeekLabel(entries[0].date), 
          change,
          macros: macrosSum.calories > 0 || macrosSum.protein > 0 || macrosSum.carbs > 0 || macrosSum.fat > 0 ? macrosSum : null,
          hasNotes
        });
      });
      
      let prevChange: number | null = null;
      if (weekly.length >= 2) {
        prevChange = weekly[weekly.length - 2].avgWeight - weekly[weekly.length - 1].avgWeight;
      }
      
      return { data: weekly, prevChange };
    }
    
    if (weightViewMode === 'monthly') {
      const monthGroups = new Map<string, WeightEntry[]>();
      sorted.forEach(entry => {
        const key = getMonthKey(entry.date);
        if (!monthGroups.has(key)) monthGroups.set(key, []);
        monthGroups.get(key)!.push(entry);
      });
      
      const monthly: { date: string; avgWeight: number; monthLabel: string; change: number | null; macros: { calories: number; protein: number; carbs: number; fat: number } | null; hasNotes: boolean }[] = [];
      const sortedMonths = Array.from(monthGroups.keys()).sort();
      
      sortedMonths.forEach((monthKey, idx) => {
        const entries = monthGroups.get(monthKey)!;
        const sum = entries.reduce((acc, e) => acc + e.weight, 0);
        const avg = sum / entries.length;
        const prevAvg = idx > 0 ? monthly[idx - 1].avgWeight : null;
        const change = prevAvg !== null ? prevAvg - avg : null;
        
        const macrosSum = entries.reduce((acc, e) => ({
          calories: acc.calories + (e.macros?.calories || 0),
          protein: acc.protein + (e.macros?.protein || 0),
          carbs: acc.carbs + (e.macros?.carbs || 0),
          fat: acc.fat + (e.macros?.fat || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        
        const hasNotes = entries.some(e => e.notes);
        
        monthly.push({ 
          date: monthKey, 
          avgWeight: avg, 
          monthLabel: getMonthLabel(entries[0].date), 
          change,
          macros: macrosSum.calories > 0 || macrosSum.protein > 0 || macrosSum.carbs > 0 || macrosSum.fat > 0 ? macrosSum : null,
          hasNotes
        });
      });
      
      let prevChange: number | null = null;
      if (monthly.length >= 2) {
        prevChange = monthly[monthly.length - 2].avgWeight - monthly[monthly.length - 1].avgWeight;
      }
      
      return { data: monthly, prevChange };
    }
    
    return { data: sorted, prevChange: null };
  }, [weightEntries, weightViewMode]);

  const allMedications = useMemo(() => {
    const medSet = new Set<string>();
    manualEntries.forEach(e => medSet.add(e.medication));
    protocols.forEach(p => medSet.add(p.medication));
    return Array.from(medSet);
  }, [manualEntries, protocols]);

  const sortedEntries = useMemo(() => {
    return [...manualEntries].sort((a, b) => {
      if (sortBy === 'date') {
        return sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      } else if (sortBy === 'medication') {
        return sortAsc ? a.medication.localeCompare(b.medication) : b.medication.localeCompare(a.medication);
      } else if (sortBy === 'dose') {
        return sortAsc ? a.dose - b.dose : b.dose - a.dose;
      }
      return 0;
    });
  }, [manualEntries, sortBy, sortAsc]);

  const getMedColor = (medicationName: string) => {
    return getMedicationColorByName(medicationName, allMedications).stroke;
  };
  const [editSideEffects, setEditSideEffects] = useState<SideEffect[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [activeSideEffect, setActiveSideEffect] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      const entries = getMedicationManualEntries();
      const prots = getMedicationProtocols();
      setManualEntries(entries.sort((a, b) => b.date.localeCompare(a.date)));
      setProtocols(prots);

      const realWeightEntries = getWeightEntries();
      setWeightEntries(realWeightEntries);

      const loadedPeptides = getPeptides();
      setPeptides(loadedPeptides);
      const loadedPeptideLogs = getPeptideLogs();
      setPeptideLogs(loadedPeptideLogs.sort((a, b) => b.date.localeCompare(a.date)));
    };
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    localStorage.setItem('glpal_dose_log_collapsed', String(isDoseLogCollapsed));
  }, [isDoseLogCollapsed]);

  useEffect(() => {
    localStorage.setItem('glpal_weight_log_collapsed', String(isWeightLogCollapsed));
  }, [isWeightLogCollapsed]);

  useEffect(() => {
    localStorage.setItem('glpal_peptide_log_collapsed', String(isPeptideLogCollapsed));
  }, [isPeptideLogCollapsed]);

  useEffect(() => {
    if (editingEntry) {
      setIsSideEffectsVisible(true);
      setIsSideEffectsClosing(false);
      document.body.classList.add('modal-open');
    } else if (isSideEffectsVisible && !isSideEffectsClosing) {
      setIsSideEffectsClosing(true);
      setTimeout(() => {
        setIsSideEffectsVisible(false);
        setIsSideEffectsClosing(false);
        document.body.classList.remove('modal-open');
      }, 200);
    }
  }, [editingEntry, isSideEffectsVisible, isSideEffectsClosing]);

  useEffect(() => {
    if (editingWeightEntry) {
      setIsWeightModalVisible(true);
      setIsWeightModalClosing(false);
      document.body.classList.add('modal-open');
    } else if (isWeightModalVisible && !isWeightModalClosing) {
      setIsWeightModalClosing(true);
      setTimeout(() => {
        setIsWeightModalVisible(false);
        setIsWeightModalClosing(false);
        document.body.classList.remove('modal-open');
      }, 200);
    }
  }, [editingWeightEntry, isWeightModalVisible, isWeightModalClosing]);

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

  const openWeightEditor = (entry: WeightEntry) => {
    setEditingWeightEntry(entry);
    setEditWeightNotes(entry.notes || '');
    setEditWeightMacros(entry.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const handleSaveWeightMacros = () => {
    if (!editingWeightEntry) return;
    
    const updatedEntries = weightEntries.map(entry => 
      entry.date === editingWeightEntry.date 
        ? { 
            ...entry, 
            notes: editWeightNotes || undefined, 
            macros: (editWeightMacros.calories > 0 || editWeightMacros.protein > 0 || editWeightMacros.carbs > 0 || editWeightMacros.fat > 0) 
              ? editWeightMacros 
              : undefined 
          }
        : entry
    );
    
    saveWeightEntries(updatedEntries);
    setWeightEntries(updatedEntries);
    setEditingWeightEntry(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-3 pb-20">
      <div className={bigCard}>
        <div className="flex justify-between items-center mb-2">
          <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Dose Log</h1>
          <button
            onClick={() => setIsDoseLogCollapsed(!isDoseLogCollapsed)}
            className="text-text-muted hover:text-white transition-colors"
          >
            {isDoseLogCollapsed ? '▼' : '▲'}
          </button>
        </div>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        {isDoseLogCollapsed ? (
          <p className="text-text-muted text-center py-2">{manualEntries.length} entries</p>
        ) : manualEntries.length === 0 ? (
          <p className="text-text-muted text-center py-8">No manually logged doses yet.</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1">
                {(['date', 'medication', 'dose'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => { if (sortBy === key) setSortAsc(!sortAsc); else { setSortBy(key); setSortAsc(false); } }}
                    className={`px-2 py-1 text-xs rounded transition-all ${
                      sortBy === key 
                        ? 'bg-[#B19CD9] text-white' 
                        : isDarkMode
                          ? 'bg-black/20 text-text-muted hover:text-white'
                          : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {key === 'date' ? 'Date' : key === 'medication' ? 'Med' : 'Dose'}
                    {sortBy === key && (
                      <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {sortedEntries.map((entry) => (
              <div 
                key={`${entry.date}-${entry.medication}-${entry.time || ''}`}
                className={`rounded-lg p-3 border ${
                  isDarkMode 
                    ? 'bg-black/20 border-[#B19CD9]/20' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-text-primary font-medium">{formatDate(entry.date)}</p>
                    <p className="text-sm" style={{ color: getMedColor(entry.medication) }}>{entry.medication}</p>
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
                      + Side Effects / Notes
                    </button>
                  </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      <div className={bigCard}>
        <div className="flex justify-between items-center mb-2">
          <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Weight Log</h1>
          <button
            onClick={() => setIsWeightLogCollapsed(!isWeightLogCollapsed)}
            className="text-text-muted hover:text-white transition-colors"
          >
            {isWeightLogCollapsed ? '▼' : '▲'}
          </button>
        </div>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        {isWeightLogCollapsed ? (
          <p className="text-text-muted text-center py-2">{weightEntries.length} entries</p>
        ) : weightEntries.length === 0 ? (
          <p className="text-text-muted text-center py-8">No weight entries yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setWeightViewMode(mode)}
                  className={`px-2 py-2 text-sm rounded-lg transition-all duration-300 ${
                    weightViewMode === mode
                      ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                      : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            
            {aggregatedWeightData.prevChange !== null && (
              <div className={`text-xs text-center mb-2 py-1 rounded ${
                aggregatedWeightData.prevChange > 0 
                  ? 'bg-green-500/20 text-green-400' 
                  : aggregatedWeightData.prevChange < 0 
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gray-500/20 text-gray-400'
              }`}>
                {aggregatedWeightData.prevChange > 0 
                  ? `${convertWeightFromKg(aggregatedWeightData.prevChange, unitSystem).toFixed(1)}${weightUnit} VS Last ${weightViewMode.charAt(0).toUpperCase() + weightViewMode.slice(1)}`
                  : aggregatedWeightData.prevChange < 0 
                    ? `${Math.abs(convertWeightFromKg(aggregatedWeightData.prevChange, unitSystem)).toFixed(1)}${weightUnit} VS Last ${weightViewMode.charAt(0).toUpperCase() + weightViewMode.slice(1)}`
                    : `No Change VS Last ${weightViewMode.charAt(0).toUpperCase() + weightViewMode.slice(1)}`
                }
              </div>
            )}
            
            <div className="space-y-2">
              {(aggregatedWeightData.data as any[]).slice().reverse().map((entry: any, idx: number) => (
                <div 
                  key={entry.date + '-' + idx}
                  className={`rounded-lg p-3 border ${
                    isDarkMode 
                      ? 'bg-black/20 border-[#B19CD9]/20' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-text-primary font-medium">
                        {weightViewMode === 'daily' 
                          ? formatDate(entry.date)
                          : weightViewMode === 'weekly'
                            ? entry.weekLabel
                            : entry.monthLabel
                        }
                      </p>
                      {entry.change !== null && (
                        <p className={`text-xs ${
                          entry.change > 0 ? 'text-green-400' : entry.change < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {entry.change > 0 ? '↓' : entry.change < 0 ? '↑' : '='} {Math.abs(convertWeightFromKg(entry.change, unitSystem)).toFixed(1)}{weightUnit}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[#4ADEA8] font-bold">
                        {weightViewMode === 'daily' 
                          ? `${convertWeightFromKg(entry.weight, unitSystem).toFixed(1)}${weightUnit}` 
                          : `${convertWeightFromKg(entry.avgWeight, unitSystem).toFixed(1)}${weightUnit}`
                        }
                      </p>
                    </div>
                  </div>
                  {(entry as any).macros || (entry as any).notes || (entry as any).hasNotes ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(entry as any).macros && (
                        <>
                          {(entry as any).macros.calories > 0 && (
                            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                              {(entry as any).macros.calories} cal
                            </span>
                          )}
                          {(entry as any).macros.protein > 0 && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                              P: {(entry as any).macros.protein}g
                            </span>
                          )}
                          {(entry as any).macros.carbs > 0 && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                              C: {(entry as any).macros.carbs}g
                            </span>
                          )}
                          {(entry as any).macros.fat > 0 && (
                            <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded">
                              F: {(entry as any).macros.fat}g
                            </span>
                          )}
                        </>
                      )}
                      {((entry as any).notes || (entry as any).hasNotes) && (
                        <span className="text-xs bg-[#B19CD9]/20 text-[#B19CD9] px-2 py-1 rounded">
                          📝
                        </span>
                      )}
                    </div>
                  ) : null}
                  {weightViewMode === 'daily' && (
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => openWeightEditor(entry)}
                        className="px-3 py-1 text-xs rounded-lg transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_10px_rgba(177,156,217,0.4)]"
                      >
                        + Macros / Notes
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {!isSideEffectsVisible ? null : (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className={`fixed inset-0 bg-black/60 ${isSideEffectsClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}
            style={{ backdropFilter: 'blur(8px)' }} 
            onClick={() => setEditingEntry(null)} 
          />
          <div className={`relative rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto pointer-events-auto ${
            isDarkMode 
              ? 'bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95' 
              : 'bg-white/95'
          } ${isSideEffectsClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
            {!editingEntry ? null : (
            <>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Side Effects & Notes</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-text-muted' : 'text-gray-600'}`}>{formatDate(editingEntry.date)} - <span style={{ color: getMedColor(editingEntry.medication) }}>{editingEntry.medication}</span></p>
            
            <div className={`border-t my-4 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>
            
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
                      className={`text-xs border px-2 py-1 rounded transition-all ${
                        isDarkMode
                          ? 'bg-black/20 border-[#B19CD9]/30 text-[#B19CD9] hover:bg-[#B19CD9]/20 hover:border-[#B19CD9]/50'
                          : 'bg-white border-gray-300 text-[#9C7BD3] hover:bg-gray-100'
                      }`}
                    >
                      + {se}
                    </button>
                  ))}
                </div>
                
                {editSideEffects.length > 0 && (
                  <div className="space-y-3">
                    {editSideEffects.map((se) => (
                      <div key={se.name} className={`rounded-lg p-3 border ${
                        isDarkMode 
                          ? 'bg-black/20 border-[#B19CD9]/20' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
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
              
              <div className={`border-t my-4 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-text-secondary' : 'text-gray-700'}`}>
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none resize-none ${
                    isDarkMode
                      ? 'bg-black/20 border-[#B19CD9]/30 text-text-primary placeholder-text-muted focus:border-[#B19CD9]/60'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#9C7BD3]'
                  }`}
                  rows={3}
                />
              </div>
            </div>
            
            <div className={`border-t my-4 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setEditingEntry(null)}
                className={`flex-1 py-3 rounded-xl border transition-all font-medium ${
                  isDarkMode
                    ? 'border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
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
            </>
            )}
          </div>
        </div>
      )}

      {isWeightModalVisible && editingWeightEntry ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className={`fixed inset-0 bg-black/60 ${isWeightModalClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}
            style={{ backdropFilter: 'blur(8px)' }} 
            onClick={() => setEditingWeightEntry(null)} 
          />
          <div className={`relative rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto pointer-events-auto ${
              isWeightModalClosing ? 'modal-fade-out' : 'modal-content-fade-in'
            } ${
              isDarkMode 
                ? 'bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95' 
                : 'bg-white/95'
            }`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Macros & Notes</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-text-muted' : 'text-gray-600'}`}>{formatDate(editingWeightEntry.date)} - {convertWeightFromKg(editingWeightEntry.weight, unitSystem).toFixed(1)}{weightUnit}</p>
            
            <div className={`border-t my-4 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Macros
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-orange-400 mb-1">Calories</label>
                    {useWheelForNumbers ? (
                      <button
                        type="button"
                        onClick={() => setShowCaloriePicker(true)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm text-left ${
                          isDarkMode
                            ? 'border-[#B19CD9]/30 bg-black/20 text-text-primary'
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      >
                        {editWeightMacros.calories || 'Tap to select'}
                      </button>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={editWeightMacros.calories || ''}
                        onChange={(e) => setEditWeightMacros({ ...editWeightMacros, calories: parseInt(e.target.value) || 0 })}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                          isDarkMode
                            ? 'bg-black/20 border-[#B19CD9]/30 text-text-primary'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="0"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-blue-400 mb-1">Protein (g)</label>
                    {useWheelForNumbers ? (
                      <button
                        type="button"
                        onClick={() => setShowProteinPicker(true)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm text-left ${
                          isDarkMode
                            ? 'border-[#B19CD9]/30 bg-black/20 text-text-primary'
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      >
                        {editWeightMacros.protein || 'Tap to select'}
                      </button>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={editWeightMacros.protein || ''}
                        onChange={(e) => setEditWeightMacros({ ...editWeightMacros, protein: parseInt(e.target.value) || 0 })}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                          isDarkMode
                            ? 'bg-black/20 border-[#B19CD9]/30 text-text-primary'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="0"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-yellow-400 mb-1">Carbs (g)</label>
                    {useWheelForNumbers ? (
                      <button
                        type="button"
                        onClick={() => setShowCarbsPicker(true)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm text-left ${
                          isDarkMode
                            ? 'border-[#B19CD9]/30 bg-black/20 text-text-primary'
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      >
                        {editWeightMacros.carbs || 'Tap to select'}
                      </button>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={editWeightMacros.carbs || ''}
                        onChange={(e) => setEditWeightMacros({ ...editWeightMacros, carbs: parseInt(e.target.value) || 0 })}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                          isDarkMode
                            ? 'bg-black/20 border-[#B19CD9]/30 text-text-primary'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="0"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-pink-400 mb-1">Fat (g)</label>
                    {useWheelForNumbers ? (
                      <button
                        type="button"
                        onClick={() => setShowFatPicker(true)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm text-left ${
                          isDarkMode
                            ? 'border-[#B19CD9]/30 bg-black/20 text-text-primary'
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      >
                        {editWeightMacros.fat || 'Tap to select'}
                      </button>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={editWeightMacros.fat || ''}
                        onChange={(e) => setEditWeightMacros({ ...editWeightMacros, fat: parseInt(e.target.value) || 0 })}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                          isDarkMode
                            ? 'bg-black/20 border-[#B19CD9]/30 text-text-primary'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="0"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <div className={`border-t my-4 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-text-secondary' : 'text-gray-700'}`}>
                  Notes
                </label>
                <textarea
                  value={editWeightNotes}
                  onChange={(e) => setEditWeightNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none resize-none ${
                    isDarkMode
                      ? 'bg-black/20 border-[#B19CD9]/30 text-text-primary placeholder-text-muted focus:border-[#B19CD9]/60'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#9C7BD3]'
                  }`}
                  rows={3}
                />
              </div>
            </div>
            
            <div className={`border-t my-4 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setEditingWeightEntry(null)}
                className={`flex-1 py-3 rounded-xl border transition-all font-medium ${
                  isDarkMode
                    ? 'border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWeightMacros}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white font-medium hover:shadow-[0_0_20px_rgba(74,222,168,0.5)] transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Peptide Log Section */}
      <div className={bigCard}>
        <div className="flex justify-between items-center mb-2">
          <h1 className={bigCardText.title} style={{ textShadow: '0 0 15px var(--accent-purple-light-shadow)' }}>Peptide Log</h1>
          <button
            onClick={() => setIsPeptideLogCollapsed(!isPeptideLogCollapsed)}
            className="text-text-muted hover:text-white transition-colors"
          >
            {isPeptideLogCollapsed ? '▼' : '▲'}
          </button>
        </div>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        {isPeptideLogCollapsed ? (
          <p className="text-text-muted text-center py-2">{peptideLogs.length} entries</p>
        ) : peptideLogs.length === 0 ? (
          <p className="text-text-muted text-center py-8">No peptide logs yet.</p>
        ) : (
          <div className="space-y-2">
            {peptideLogs.map((log) => {
              const peptide = peptides.find(p => p.id === log.peptideId);
              return (
                <div 
                  key={log.id}
                  className={`rounded-lg p-3 border ${
                    isDarkMode 
                      ? 'bg-black/20 border-[#B19CD9]/20' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-text-primary font-medium">{formatDate(log.date)}</p>
                      <p className="text-sm" style={{ color: peptide?.color || '#B19CD9' }}>{peptide?.name || 'Unknown Peptide'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#4ADEA8] font-bold">{log.dose}{log.doseUnit}</p>
                    </div>
                  </div>
                  <div className="border-t border-[#B19CD9]/10 pt-2 mt-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      {log.time && (
                        <span className="text-xs bg-[#B19CD9]/20 text-[#B19CD9] px-2 py-1 rounded">
                          {log.time}
                        </span>
                      )}
                      {log.injectionSite && (
                        <span className="text-xs bg-[#4ADEA8]/20 text-[#4ADEA8] px-2 py-1 rounded">
                          {log.injectionSite}
                        </span>
                      )}
                      {log.painLevel !== null && log.painLevel > 0 && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          log.painLevel <= 3 ? 'bg-green-500/20 text-green-400' :
                          log.painLevel <= 6 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          Pain: {log.painLevel}/10
                        </span>
                      )}
                    </div>
                  </div>
                  {log.notes && (
                    <div className="mt-2 pt-2 border-t border-[#B19CD9]/10">
                      <p className="text-xs text-text-muted">
                        <span className="text-text-primary">Notes:</span> {log.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Wheel Pickers for Macros */}
      <DoseWheelPickerModal
        isOpen={showCaloriePicker}
        onSave={(value) => {
          setEditWeightMacros({ ...editWeightMacros, calories: parseInt(value) || 0 });
          setShowCaloriePicker(false);
        }}
        onClose={() => setShowCaloriePicker(false)}
        min={0}
        max={3000}
        step={10}
        label="Calories"
        decimals={0}
        defaultValue={String(editWeightMacros.calories)}
        presets={['500', '1000', '1500', '2000']}
      />
      <DoseWheelPickerModal
        isOpen={showProteinPicker}
        onSave={(value) => {
          setEditWeightMacros({ ...editWeightMacros, protein: parseInt(value) || 0 });
          setShowProteinPicker(false);
        }}
        onClose={() => setShowProteinPicker(false)}
        min={0}
        max={500}
        label="Protein (g)"
        decimals={0}
        defaultValue={String(editWeightMacros.protein)}
        presets={['20', '40', '80', '150']}
      />
      <DoseWheelPickerModal
        isOpen={showCarbsPicker}
        onSave={(value) => {
          setEditWeightMacros({ ...editWeightMacros, carbs: parseInt(value) || 0 });
          setShowCarbsPicker(false);
        }}
        onClose={() => setShowCarbsPicker(false)}
        min={0}
        max={1000}
        label="Carbs (g)"
        decimals={0}
        defaultValue={String(editWeightMacros.carbs)}
        presets={['20', '40', '80', '150']}
      />
      <DoseWheelPickerModal
        isOpen={showFatPicker}
        onSave={(value) => {
          setEditWeightMacros({ ...editWeightMacros, fat: parseInt(value) || 0 });
          setShowFatPicker(false);
        }}
        onClose={() => setShowFatPicker(false)}
        min={0}
        max={500}
        label="Fat (g)"
        decimals={0}
        defaultValue={String(editWeightMacros.fat)}
        presets={['20', '40', '80', '150']}
      />
    </div>
  );
};

export default LogTab;
