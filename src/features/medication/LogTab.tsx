import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GLP1Entry, GLP1Protocol, SideEffect, WeightEntry, WeightMacros, UserProfile, PeptideLogEntry, Peptide, DailyLogEntry } from '../../types';
import { getMedicationColorByName } from '../../shared/utils/chartUtils';
import { useThemeStyles, Collapse } from '../../contexts/ThemeContext';
import { convertWeightFromKg, getWeightUnit, convertWeightToKg, convertHydrationFromMl, getHydrationUnit } from '../../shared/utils/unitConversion';
import { useAppStore } from '../../stores/appStore';
import { saveMedicationManualEntries, saveWeightEntries, addWeightEntry } from '../../shared/utils/database';
import { ModalType } from '../../shared/hooks/useAppHistory';
import DoseWheelPickerModal from '../../shared/components/DoseWheelPickerModal';
import QuickLogModal from '../dashboard/components/QuickLogModal';
import { db } from '../../db/dexie';
import { timeService } from '../../core/timeService';

interface LogTabProps {
  refreshKey?: number;
  profile?: UserProfile;
  useWheelForNumbers?: boolean;
  activeModal?: ModalType;
  onOpenModal?: (modal: ModalType) => void;
  onCloseModal?: () => void;
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

const LogTab: React.FC<LogTabProps> = ({ profile, useWheelForNumbers = true, activeModal, onOpenModal, onCloseModal }) => {
  const { bigCard, isDarkMode, inputButton, input: inputStyle, textarea, modal, modalText } = useThemeStyles();
  const unitSystem = profile?.unitSystem || 'metric';
  const weightUnit = getWeightUnit(unitSystem);
  const bigCardText = {
    title: "text-lg font-bold text-text-primary mb-2"
  };
  
  const { weights, dosesEntries, protocols, peptides, peptideLogs, addPeptideLog, deletePeptideLog, addPeptide, updatePeptide, deletePeptide, addWeight, deleteWeight, refreshWeights } = useAppStore();
  
  const [manualEntries, setManualEntries] = useState<GLP1Entry[]>(() => 
    dosesEntries.filter(e => e.isManual).sort((a, b) => b.date.localeCompare(a.date))
  );
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(() => 
    [...weights].sort((a, b) => b.date.localeCompare(a.date))
  );
  
  const [editingEntry, setEditingEntry] = useState<GLP1Entry | null>(null);
  const [isDoseLogCollapsed, setIsDoseLogCollapsed] = useState(() => {
    const saved = localStorage.getItem('glpal_dose_log_collapsed');
    return saved === 'true';
  });
  const [sortBy, setSortBy] = useState<'date' | 'medication' | 'dose'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [isSideEffectsVisible, setIsSideEffectsVisible] = useState(false);
  const [isSideEffectsClosing, setIsSideEffectsClosing] = useState(false);
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
  const [quickLogDate, setQuickLogDate] = useState<string | null>(null);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>([]);

  // Fetch daily logs
  useEffect(() => {
    const fetchDailyLogs = async () => {
      const logs = await db.dailyLogs.toArray();
      setDailyLogs(logs);
    };
    fetchDailyLogs();
  }, []);

  const getDailyLog = (date: string): DailyLogEntry | undefined => {
    return dailyLogs.find(log => log.date === date);
  };

  const getSeverityColor = (severity: number, isDark: boolean = true): string => {
    if (severity <= 3) return isDark ? 'text-green-400 bg-green-500/20' : 'text-green-700 bg-green-100';
    if (severity <= 6) return isDark ? 'text-yellow-400 bg-yellow-500/20' : 'text-yellow-700 bg-yellow-100';
    return isDark ? 'text-red-400 bg-red-500/20' : 'text-red-700 bg-red-100';
  };

  // Derive modal visibility from activeModal if modal system is available
  const isSideEffectsModalOpen = activeModal === 'sideEffects';
  const isMacrosModalOpen = activeModal === 'macros';
  
  // Sync local state with modal system when activeModal changes
  useEffect(() => {
    if (activeModal === 'sideEffects') {
      setIsSideEffectsVisible(true);
    } else if (activeModal === null && isSideEffectsVisible) {
      setIsSideEffectsVisible(false);
      setEditingEntry(null);
    }
  }, [activeModal]);
  
  useEffect(() => {
    if (activeModal === 'macros') {
      setIsWeightModalVisible(true);
    } else if (activeModal === null && isWeightModalVisible) {
      setIsWeightModalVisible(false);
      setEditingWeightEntry(null);
    }
  }, [activeModal]);
  
  // Helper to close side effects modal - just tell parent to close
  const closeSideEffectsModal = () => {
    if (onCloseModal) {
      onCloseModal();
    }
  };
  
  // Helper to close macros modal - just tell parent to close
  const closeMacrosModal = () => {
    if (onCloseModal) {
      onCloseModal();
    }
  };
  const [isPeptideLogCollapsed, setIsPeptideLogCollapsed] = useState(() => {
    const saved = localStorage.getItem('glpal_peptide_log_collapsed');
    return saved === 'true';
  });

  const [doseDisplayLimit, setDoseDisplayLimit] = useState(5);
  const [prevDoseLimit, setPrevDoseLimit] = useState(5);
  const [weightDisplayLimit, setWeightDisplayLimit] = useState(10);
  const [prevWeightLimit, setPrevWeightLimit] = useState(10);
  const [peptideDisplayLimit, setPeptideDisplayLimit] = useState(5);
  const [prevPeptideLimit, setPrevPeptideLimit] = useState(5);

  const [showCaloriePicker, setShowCaloriePicker] = useState(false);
  const [showProteinPicker, setShowProteinPicker] = useState(false);
  const [showCarbsPicker, setShowCarbsPicker] = useState(false);
  const [showFatPicker, setShowFatPicker] = useState(false);

  const weeklyAverages = useMemo(() => {
    if (weights.length === 0) return new Map<string, number>();
    
    const weekGroups = new Map<string, WeightEntry[]>();
    weights.forEach(entry => {
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
  }, [weights]);

  const aggregatedWeightData = useMemo(() => {
    if (weights.length === 0) return { data: [], prevChange: null };
    
    const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
    
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
        if (!weekGroups.has(key)) {
          weekGroups.set(key, []);
        }
        weekGroups.get(key)!.push(entry);
      });
      
      const weekly: (WeightEntry & { change: number | null; weekLabel: string; hydration?: number; mood?: number; sideEffectsAvg?: number })[] = [];
      let prevAvg: number | null = null;
      
      const sortedWeeks = Array.from(weekGroups.keys()).sort();
      sortedWeeks.forEach(weekKey => {
        const entries = weekGroups.get(weekKey)!;
        const avg = entries.reduce((sum, e) => sum + e.weight, 0) / entries.length;
        const change = prevAvg !== null ? prevAvg - avg : null;
        prevAvg = avg;
        
        const weekLabel = getWeekLabel(entries[0].date);
        
        const notes = entries.filter(e => e.notes).map(e => e.notes).filter(Boolean).join('; ');
        
        const aggregatedMacros = entries.reduce(
          (acc, e) => {
            if (e.macros) {
              acc.calories += e.macros.calories || 0;
              acc.protein += e.macros.protein || 0;
              acc.carbs += e.macros.carbs || 0;
              acc.fat += e.macros.fat || 0;
            }
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        const macros = aggregatedMacros.calories > 0 || aggregatedMacros.protein > 0 || aggregatedMacros.carbs > 0 || aggregatedMacros.fat > 0 
          ? aggregatedMacros 
          : undefined;
        
        // Get daily logs data for this week
        const weekDates = entries.map(e => e.date);
        const weekLogs = dailyLogs.filter(log => weekDates.includes(log.date));
        const hydration = weekLogs.some(l => l.hydration !== undefined) 
          ? Math.round(weekLogs.reduce((sum, l) => sum + (l.hydration || 0), 0) / weekLogs.length)
          : undefined;
        const moodValues = weekLogs.filter(l => l.mood !== undefined && l.mood > 0).map(l => l.mood!);
        const mood = moodValues.length > 0 
          ? Math.round(moodValues.reduce((a, b) => a + b, 0) / moodValues.length)
          : undefined;
        const sideEffectSevurities = weekLogs.filter(l => l.sideEffects && l.sideEffects.length > 0)
          .flatMap(l => l.sideEffects!.map(se => se.severity));
        const sideEffectsAvg = sideEffectSevurities.length > 0 
          ? Math.round(sideEffectSevurities.reduce((a, b) => a + b, 0) / sideEffectSevurities.length)
          : undefined;
        
        weekly.push({
          date: weekKey,
          weight: avg,
          change,
          weekLabel,
          notes: notes || undefined,
          macros,
          hydration,
          mood,
          sideEffectsAvg,
        });
      });
      
      let prevChange: number | null = null;
      if (weekly.length >= 2) {
        prevChange = weekly[weekly.length - 2].weight - weekly[weekly.length - 1].weight;
      }
      
      return { data: weekly, prevChange };
    }
    
    if (weightViewMode === 'monthly') {
      const monthGroups = new Map<string, WeightEntry[]>();
      sorted.forEach(entry => {
        const key = getMonthKey(entry.date);
        if (!monthGroups.has(key)) {
          monthGroups.set(key, []);
        }
        monthGroups.get(key)!.push(entry);
      });
      
      const monthly: (WeightEntry & { change: number | null; monthLabel: string; hydration?: number; mood?: number; sideEffectsAvg?: number })[] = [];
      let prevAvg: number | null = null;
      
      const sortedMonths = Array.from(monthGroups.keys()).sort();
      sortedMonths.forEach(monthKey => {
        const entries = monthGroups.get(monthKey)!;
        const avg = entries.reduce((sum, e) => sum + e.weight, 0) / entries.length;
        const change = prevAvg !== null ? prevAvg - avg : null;
        prevAvg = avg;
        
        const monthLabel = getMonthLabel(entries[0].date);
        
        const notes = entries.filter(e => e.notes).map(e => e.notes).filter(Boolean).join('; ');
        
        const aggregatedMacros = entries.reduce(
          (acc, e) => {
            if (e.macros) {
              acc.calories += e.macros.calories || 0;
              acc.protein += e.macros.protein || 0;
              acc.carbs += e.macros.carbs || 0;
              acc.fat += e.macros.fat || 0;
            }
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        const macros = aggregatedMacros.calories > 0 || aggregatedMacros.protein > 0 || aggregatedMacros.carbs > 0 || aggregatedMacros.fat > 0 
          ? aggregatedMacros 
          : undefined;
        
        // Get daily logs data for this month
        const monthDates = entries.map(e => e.date);
        const monthLogs = dailyLogs.filter(log => monthDates.includes(log.date));
        const hydration = monthLogs.some(l => l.hydration !== undefined) 
          ? Math.round(monthLogs.reduce((sum, l) => sum + (l.hydration || 0), 0) / monthLogs.length)
          : undefined;
        const moodValues = monthLogs.filter(l => l.mood !== undefined && l.mood > 0).map(l => l.mood!);
        const mood = moodValues.length > 0 
          ? Math.round(moodValues.reduce((a, b) => a + b, 0) / moodValues.length)
          : undefined;
        const sideEffectSevurities = monthLogs.filter(l => l.sideEffects && l.sideEffects.length > 0)
          .flatMap(l => l.sideEffects!.map(se => se.severity));
        const sideEffectsAvg = sideEffectSevurities.length > 0 
          ? Math.round(sideEffectSevurities.reduce((a, b) => a + b, 0) / sideEffectSevurities.length)
          : undefined;
        
        monthly.push({
          date: monthKey + '-01',
          weight: avg,
          change,
          monthLabel,
          notes: notes || undefined,
          macros,
          hydration,
          mood,
          sideEffectsAvg,
        });
      });
      
      let prevChange: number | null = null;
      if (monthly.length >= 2) {
        prevChange = monthly[monthly.length - 2].weight - monthly[monthly.length - 1].weight;
      }
      
      return { data: monthly, prevChange };
    }
    
    return { data: sorted, prevChange: null };
  }, [weights, weightViewMode, dailyLogs]);

  const allMedications = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    dosesEntries.forEach(entry => {
      if (!seen.has(entry.medication)) {
        seen.add(entry.medication);
        order.push(entry.medication);
      }
    });
    return order;
  }, [dosesEntries]);

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
    localStorage.setItem('glpal_dose_log_collapsed', String(isDoseLogCollapsed));
  }, [isDoseLogCollapsed]);

  useEffect(() => {
    localStorage.setItem('glpal_weight_log_collapsed', String(isWeightLogCollapsed));
  }, [isWeightLogCollapsed]);

  useEffect(() => {
    localStorage.setItem('glpal_peptide_log_collapsed', String(isPeptideLogCollapsed));
  }, [isPeptideLogCollapsed]);

  useEffect(() => {
    setManualEntries(dosesEntries.filter(e => e.isManual).sort((a, b) => b.date.localeCompare(a.date)));
  }, [dosesEntries]);

  useEffect(() => {
    setWeightEntries([...weights].sort((a, b) => b.date.localeCompare(a.date)));
  }, [weights]);

  useEffect(() => {
    if (editingEntry) {
      setIsSideEffectsVisible(true);
      setIsSideEffectsClosing(false);
      document.body.classList.add('modal-open');
    }
  }, [editingEntry]);

  // Separate effect to handle closing and cleanup
  useEffect(() => {
    if (!isSideEffectsVisible && editingEntry === null) {
      // Modal was closed - remove the class
      document.body.classList.remove('modal-open');
    }
  }, [isSideEffectsVisible, editingEntry]);
  
  useEffect(() => {
    if (editingWeightEntry) {
      setIsWeightModalVisible(true);
      setIsWeightModalClosing(false);
      document.body.classList.add('modal-open');
    }
  }, [editingWeightEntry]);

  useEffect(() => {
    if (!isWeightModalVisible && editingWeightEntry === null) {
      document.body.classList.remove('modal-open');
    }
  }, [isWeightModalVisible, editingWeightEntry]);

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
    closeSideEffectsModal();
  };

  const openSideEffectsEditor = (entry: GLP1Entry) => {
    setEditingEntry(entry);
    setEditSideEffects(entry.sideEffects || []);
    setEditNotes(entry.notes || '');
    setActiveSideEffect(null);
    if (onOpenModal) {
      onOpenModal('sideEffects');
    } else {
      setIsSideEffectsVisible(true);
    }
  };

  const openWeightEditor = (entry: WeightEntry) => {
    setEditingWeightEntry(entry);
    setEditWeightNotes(entry.notes || '');
    setEditWeightMacros(entry.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 });
    if (onOpenModal) {
      onOpenModal('macros');
    } else {
      setIsWeightModalVisible(true);
    }
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
    refreshWeights();
    closeMacrosModal();
  };

  const handleQuickLogSave = useCallback(async (entry: DailyLogEntry, weightKg?: number) => {
    if (weightKg) {
      const weightEntry: WeightEntry = {
        date: entry.date,
        weight: weightKg,
        notes: entry.notes,
        macros: entry.macros,
      };
      await addWeightEntry(weightEntry);
      refreshWeights();
    }
    const logs = await db.dailyLogs.toArray();
    setDailyLogs(logs);
    setQuickLogDate(null);
    setIsQuickLogOpen(false);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getMoodEmoji = (value?: number): string => {
    if (value === undefined || value === 0) return '';
    if (value <= 2) return '😢';
    if (value <= 4) return '😕';
    if (value <= 6) return '😐';
    if (value <= 8) return '🙂';
    return '😊';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-20">
      <div className={bigCard}>
        <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => setIsDoseLogCollapsed(!isDoseLogCollapsed)}>
          <h1 className={bigCardText.title}>Dose Log</h1>
          <button
            onClick={(e) => { e.stopPropagation(); setIsDoseLogCollapsed(!isDoseLogCollapsed); }}
            className="text-text-muted hover:text-white transition-colors"
          >
            {isDoseLogCollapsed ? '▼' : '▲'}
          </button>
        </div>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        <Collapse isOpen={!isDoseLogCollapsed}>
          {manualEntries.length === 0 ? (
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
              {sortedEntries.slice(0, doseDisplayLimit).map((entry, idx) => (
              <div 
                key={`${entry.date}-${entry.medication}-${entry.time || ''}`}
                className={`rounded-lg p-3 border border-l-4 ${idx >= prevDoseLimit ? 'animate-fadeIn' : ''} ${
                  isDarkMode 
                    ? 'bg-black/20 border-[#B19CD9]/20' 
                    : 'bg-gray-50 border-gray-200'
                }`}
                style={{ 
                  borderLeftColor: getMedColor(entry.medication),
                  animationDelay: idx >= prevDoseLimit ? `${(idx - prevDoseLimit) * 80}ms` : undefined
                }}
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
            
            {/* Show More/Show All buttons - only show when there are more entries */}
            {sortedEntries.length > doseDisplayLimit && (
              <div className="flex gap-2 mt-4 animate-fadeIn">
                <button
                  onClick={() => { setPrevDoseLimit(doseDisplayLimit); setDoseDisplayLimit(doseDisplayLimit + 5); }}
                  className="flex-1 py-2 text-sm rounded-lg bg-[#B19CD9]/20 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Show More ({sortedEntries.length - doseDisplayLimit} more)
                </button>
                <button
                  onClick={() => { setPrevDoseLimit(doseDisplayLimit); setDoseDisplayLimit(sortedEntries.length); }}
                  className="flex-1 py-2 text-sm rounded-lg bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_10px_rgba(177,156,217,0.4)] hover:shadow-[0_0_15px_rgba(177,156,217,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Show All ({sortedEntries.length})
                </button>
              </div>
            )}
          </>
          )}
        </Collapse>
        
        {/* Entry count at bottom - only show when collapsed */}
        {isDoseLogCollapsed && (
          <p className="text-text-muted text-center py-2">{manualEntries.length} entries</p>
        )}
      </div>

      <div className={bigCard}>
        <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => setIsWeightLogCollapsed(!isWeightLogCollapsed)}>
          <h1 className={bigCardText.title}>Daily Log</h1>
          <button
            onClick={(e) => { e.stopPropagation(); setIsWeightLogCollapsed(!isWeightLogCollapsed); }}
            className="text-text-muted hover:text-white transition-colors"
          >
            {isWeightLogCollapsed ? '▼' : '▲'}
          </button>
        </div>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        <Collapse isOpen={!isWeightLogCollapsed}>
          {weightEntries.length === 0 ? (
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
            
            {aggregatedWeightData.prevChange != null && (
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
              {(aggregatedWeightData.data as any[]).slice().reverse().slice(0, weightDisplayLimit).map((entry: any, idx: number) => {
                const changeColor = entry.change !== null && entry.change !== undefined
                  ? entry.change < 0 ? '#ef4444' : entry.change > 0 ? '#22c55e' : '#6b7280'
                  : '#6b7280';
                return (
                <div 
                  key={entry.date + '-' + idx}
                  className={`rounded-lg p-3 border border-l-4 ${idx >= prevWeightLimit ? 'animate-fadeIn' : ''} ${
                    isDarkMode 
                      ? 'bg-black/20 border-[#B19CD9]/20' 
                      : 'bg-gray-50 border-gray-200'
                  } ${weightViewMode === 'daily' ? 'cursor-pointer hover:ring-2 hover:ring-[#4ADEA8]/50' : ''}`}
                  style={{ 
                    borderLeftColor: changeColor,
                    animationDelay: idx >= prevWeightLimit ? `${(idx - prevWeightLimit) * 80}ms` : undefined
                  }}
                  onClick={() => weightViewMode === 'daily' && (setQuickLogDate(entry.date), setIsQuickLogOpen(true))}
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
                      {entry.change !== null && entry.weight !== undefined && (
                        <p className={`text-xs ${
                          entry.change > 0 ? 'text-green-400' : entry.change < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {entry.change > 0 ? '↓' : entry.change < 0 ? '↑' : '='} {Math.abs(convertWeightFromKg(entry.change, unitSystem)).toFixed(1)}{weightUnit}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[#4ADEA8] font-bold">
                        {entry.weight !== undefined
                          ? `${convertWeightFromKg(entry.weight, unitSystem).toFixed(1)}${weightUnit}` 
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* All Daily Log Data */}
                  {weightViewMode === 'daily' && (() => {
                    const dailyLog = getDailyLog(entry.date);
                    const hasAnyData = dailyLog && (
                      dailyLog.hydration !== undefined ||
                      dailyLog.mood !== undefined ||
                      (dailyLog.sideEffects && dailyLog.sideEffects.length > 0) ||
                      dailyLog.calories !== undefined ||
                      (dailyLog.macros && (dailyLog.macros.calories > 0 || dailyLog.macros.protein > 0 || dailyLog.macros.carbs > 0 || dailyLog.macros.fat > 0)) ||
                      dailyLog.notes
                    );
                    
                    if (!hasAnyData) return null;
                    
                    return (
                      <div className="mt-2 space-y-2">
                        {/* Row 1: Calories and Macros */}
                        {(dailyLog?.macros || dailyLog?.calories) && (
                          <div className="flex flex-wrap gap-1">
                            {dailyLog?.macros && (
                              <>
                                {dailyLog.macros.calories > 0 && (
                                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                    </svg>
                                    {dailyLog.macros.calories} cal
                                  </span>
                                )}
                                {dailyLog.macros.protein > 0 && (
                                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                                    P: {dailyLog.macros.protein}g
                                  </span>
                                )}
                                {dailyLog.macros.carbs > 0 && (
                                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                    C: {dailyLog.macros.carbs}g
                                  </span>
                                )}
                                {dailyLog.macros.fat > 0 && (
                                  <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded">
                                    F: {dailyLog.macros.fat}g
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* Row 2: Hydration and Mood */}
                        {(dailyLog?.hydration !== undefined || (dailyLog?.mood !== undefined && dailyLog.mood > 0)) && (
                          <div className="flex flex-wrap gap-1">
                            {dailyLog?.hydration !== undefined && (
                              <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" />
                                </svg>
                                {dailyLog.hydration}ml
                              </span>
                            )}
                            {dailyLog?.mood !== undefined && dailyLog.mood > 0 && (
                              <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {dailyLog.mood}/10
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Row 3: Side Effects */}
                        {dailyLog?.sideEffects && dailyLog.sideEffects.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {dailyLog.sideEffects.map((se, idx) => (
                              <span key={idx} className={`text-xs px-2 py-1 rounded ${getSeverityColor(se.severity, isDarkMode)}`}>
                                {se.name} ({se.severity}/10)
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Row 4: Notes */}
                        {dailyLog?.notes && (
                          <div className={`p-2 rounded text-xs ${isDarkMode ? 'bg-black/20 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            {dailyLog.notes}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* Weekly/Monthly aggregated data display */}
                  {weightViewMode !== 'daily' && (() => {
                    const hasAnyData = entry.hydration !== undefined || entry.mood !== undefined || entry.sideEffectsAvg !== undefined;
                    if (!hasAnyData) return null;
                    
                    return (
                      <div className="mt-2 space-y-2">
                        {/* Row 1: Calories and Macros - not shown for weekly/monthly */}
                        
                        {/* Row 2: Hydration and Mood (averages) */}
                        {(entry.hydration !== undefined || entry.mood !== undefined) && (
                          <div className="flex flex-wrap gap-1">
                            {entry.hydration !== undefined && (
                              <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" />
                                </svg>
                                ~{entry.hydration}ml avg
                              </span>
                            )}
                            {entry.mood !== undefined && entry.mood > 0 && (
                              <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ~{entry.mood}/10 avg
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Row 3: Side Effects Average */}
                        {entry.sideEffectsAvg !== undefined && (
                          <div className="flex flex-wrap gap-1">
                            <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(entry.sideEffectsAvg, isDarkMode)}`}>
                              ~{entry.sideEffectsAvg}/10 avg
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )})}
            </div>
            
            {/* Show More/Show All buttons - only show when there are more entries */}
            {aggregatedWeightData.data.length > weightDisplayLimit && (
              <div className="flex gap-2 mt-4 animate-fadeIn">
                <button
                  onClick={() => { setPrevWeightLimit(weightDisplayLimit); setWeightDisplayLimit(weightDisplayLimit + 10); }}
                  className="flex-1 py-2 text-sm rounded-lg bg-[#B19CD9]/20 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Show More ({aggregatedWeightData.data.length - weightDisplayLimit} more)
                </button>
                <button
                  onClick={() => { setPrevWeightLimit(weightDisplayLimit); setWeightDisplayLimit(aggregatedWeightData.data.length); }}
                  className="flex-1 py-2 text-sm rounded-lg bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_10px_rgba(177,156,217,0.4)] hover:shadow-[0_0_15px_rgba(177,156,217,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Show All ({aggregatedWeightData.data.length})
                </button>
              </div>
            )}
          </>
          )}
        </Collapse>
        
        {/* Entry count at bottom - only show when collapsed */}
        {isWeightLogCollapsed && (
          <p className="text-text-muted text-center py-2">{weightEntries.length} entries</p>
        )}
      </div>

      {!isSideEffectsVisible && !isSideEffectsModalOpen ? null : (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className={`fixed inset-0 bg-black/60 ${isSideEffectsClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}
            style={{ backdropFilter: 'blur(8px)' }} 
            onClick={closeSideEffectsModal} 
          />
          <div className={`relative rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-2xl p-6 max-h-[90vh] overflow-y-auto pointer-events-auto ${modal} ${isSideEffectsClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
            {!editingEntry ? null : (
            <>
            <h3 className={`text-lg font-semibold mb-2 ${modalText.title}`}>Side Effects & Notes</h3>
            <p className={`text-sm mb-4 ${modalText.subtitle}`}>{formatDate(editingEntry.date)} - <span style={{ color: getMedColor(editingEntry.medication) }}>{editingEntry.medication}</span></p>
            
            <div className={`border-t my-4 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${modalText.label} mb-2`}>
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
                <label className={`block text-sm font-medium mb-2 ${modalText.label}`}>
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className={textarea}
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

      {(isWeightModalVisible || isMacrosModalOpen) && editingWeightEntry ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className={`fixed inset-0 bg-black/60 ${isWeightModalClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}
            style={{ backdropFilter: 'blur(8px)' }} 
            onClick={() => { setIsWeightModalVisible(false); setEditingWeightEntry(null); }} 
          />
          <div className={`relative rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-2xl p-6 max-h-[90vh] overflow-y-auto pointer-events-auto ${modal} ${isWeightModalClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${modalText.title}`}>Macros & Notes</h3>
            <p className={`text-sm mb-4 ${modalText.subtitle}`}>{formatDate(editingWeightEntry.date)} - {editingWeightEntry.weight !== undefined ? `${convertWeightFromKg(editingWeightEntry.weight, unitSystem).toFixed(1)}${weightUnit}` : '-'}</p>
            
            <div className={`border-t my-4 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${modalText.label} mb-2`}>
                  Macros
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-orange-400 mb-1">Calories</label>
                    {useWheelForNumbers ? (
                      <button
                        type="button"
                        onClick={() => setShowCaloriePicker(true)}
                        className={inputButton}
                      >
                        {editWeightMacros.calories || 'Tap to select'}
                      </button>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={editWeightMacros.calories || ''}
                        onChange={(e) => setEditWeightMacros({ ...editWeightMacros, calories: parseInt(e.target.value) || 0 })}
                        className={inputStyle}
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
                        className={inputButton}
                      >
                        {editWeightMacros.protein || 'Tap to select'}
                      </button>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={editWeightMacros.protein || ''}
                        onChange={(e) => setEditWeightMacros({ ...editWeightMacros, protein: parseInt(e.target.value) || 0 })}
                        className={inputStyle}
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
                        className={inputButton}
                      >
                        {editWeightMacros.carbs || 'Tap to select'}
                      </button>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={editWeightMacros.carbs || ''}
                        onChange={(e) => setEditWeightMacros({ ...editWeightMacros, carbs: parseInt(e.target.value) || 0 })}
                        className={inputStyle}
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
                        className={inputButton}
                      >
                        {editWeightMacros.fat || 'Tap to select'}
                      </button>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={editWeightMacros.fat || ''}
                        onChange={(e) => setEditWeightMacros({ ...editWeightMacros, fat: parseInt(e.target.value) || 0 })}
                        className={inputStyle}
                        placeholder="0"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <div className={`border-t my-4 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>
               
              <div>
                <label className={`block text-sm font-medium mb-2 ${modalText.label}`}>
                  Notes
                </label>
                <textarea
                  value={editWeightNotes}
                  onChange={(e) => setEditWeightNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className={textarea}
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
        <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => setIsPeptideLogCollapsed(!isPeptideLogCollapsed)}>
          <h1 className={bigCardText.title}>Peptide Log</h1>
          <button
            onClick={(e) => { e.stopPropagation(); setIsPeptideLogCollapsed(!isPeptideLogCollapsed); }}
            className="text-text-muted hover:text-white transition-colors"
          >
            {isPeptideLogCollapsed ? '▼' : '▲'}
          </button>
        </div>
        <div className="border-t border-[#B19CD9]/20 mb-3"></div>
        
        <Collapse isOpen={!isPeptideLogCollapsed}>
          {peptideLogs.length === 0 ? (
            <p className="text-text-muted text-center py-8">No peptide logs yet.</p>
          ) : (
            <>
            <div className="space-y-2">
              {peptideLogs.slice(0, peptideDisplayLimit).map((log, idx) => {
              const peptide = peptides.find(p => p.id === log.peptideId);
              const peptideColor = peptide?.color || '#B19CD9';
              return (
                <div 
                  key={log.id}
                  className={`rounded-lg p-3 border border-l-4 ${idx >= prevPeptideLimit ? 'animate-fadeIn' : ''} ${
                    isDarkMode 
                      ? 'bg-black/20 border-[#B19CD9]/20' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  style={{ 
                    borderLeftColor: peptideColor,
                    animationDelay: idx >= prevPeptideLimit ? `${(idx - prevPeptideLimit) * 80}ms` : undefined
                  }}
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
              );})}
            </div>
            
            {/* Show More/Show All buttons - only show when there are more entries */}
            {peptideLogs.length > peptideDisplayLimit && (
              <div className="flex gap-2 mt-4 animate-fadeIn">
                <button
                  onClick={() => { setPrevPeptideLimit(peptideDisplayLimit); setPeptideDisplayLimit(peptideDisplayLimit + 5); }}
                  className="flex-1 py-2 text-sm rounded-lg bg-[#B19CD9]/20 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Show More ({peptideLogs.length - peptideDisplayLimit} more)
                </button>
                <button
                  onClick={() => { setPrevPeptideLimit(peptideDisplayLimit); setPeptideDisplayLimit(peptideLogs.length); }}
                  className="flex-1 py-2 text-sm rounded-lg bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_10px_rgba(177,156,217,0.4)] hover:shadow-[0_0_15px_rgba(177,156,217,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Show All ({peptideLogs.length})
                </button>
              </div>
            )}
          </>
          )}
        </Collapse>
        
        {/* Entry count at bottom - only show when collapsed */}
        {isPeptideLogCollapsed && (
          <p className="text-text-muted text-center py-2">{peptideLogs.length} entries</p>
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
      
      {/* Quick Log Modal */}
      {profile && (
        <QuickLogModal
          isOpen={isQuickLogOpen}
          onClose={() => { setIsQuickLogOpen(false); setQuickLogDate(null); }}
          onSave={handleQuickLogSave}
          profile={profile}
          initialDate={quickLogDate || undefined}
        />
      )}
    </div>
  );
};

export default LogTab;
