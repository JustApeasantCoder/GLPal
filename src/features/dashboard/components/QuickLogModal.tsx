import React, { useState, useEffect, useCallback } from 'react';
import { useThemeStyles } from '../../../contexts/ThemeContext';
import { DailyLogEntry, SideEffect, WeightMacros, UserProfile } from '../../../types';
import { db } from '../../../db/dexie';
import { timeService } from '../../../core/timeService';
import { convertWeightToKg, convertWeightFromKg, getWeightUnit, convertHydrationToMl, convertHydrationFromMl, getHydrationUnit } from '../../../shared/utils/unitConversion';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: DailyLogEntry, weightKg?: number) => void;
  profile: UserProfile;
  initialDate?: string;
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

const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  profile,
  initialDate,
}) => {
  const { isDarkMode } = useThemeStyles();
  const { modal, modalText, input: inputStyle, textarea } = useThemeStyles();
  
  const unitSystem = profile.unitSystem || 'metric';
  const hydrationUnit = profile.hydrationUnit || 'ml';
  const weightUnit = getWeightUnit(unitSystem);

  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [selectedDate, setSelectedDate] = useState(timeService.todayString());
  const [weight, setWeight] = useState('');
  const [useImperialWeight, setUseImperialWeight] = useState(unitSystem === 'imperial');
  const [hydration, setHydration] = useState('');
  const [useOz, setUseOz] = useState(hydrationUnit === 'oz');
  const [mood, setMood] = useState(5);
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([]);
  const [newSideEffect, setNewSideEffect] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  const loadExistingEntry = useCallback(async () => {
    const existing = await db.dailyLogs.get(selectedDate);
    if (existing) {
      if (existing.weight !== undefined) {
        setWeight(String(convertWeightFromKg(existing.weight, useImperialWeight ? 'imperial' : 'metric')));
      }
      if (existing.hydration !== undefined) {
        setHydration(String(convertHydrationFromMl(existing.hydration, useOz ? 'oz' : 'ml')));
      }
      if (existing.mood !== undefined) {
        setMood(existing.mood);
      }
      if (existing.sideEffects !== undefined) {
        setSideEffects(existing.sideEffects);
      }
      if (existing.calories !== undefined) {
        setCalories(String(existing.calories));
      }
      if (existing.macros) {
        setProtein(String(existing.macros.protein || ''));
        setCarbs(String(existing.macros.carbs || ''));
        setFat(String(existing.macros.fat || ''));
      }
      if (existing.notes !== undefined) {
        setNotes(existing.notes);
      }
    }
  }, [selectedDate, useImperialWeight, useOz]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      document.body.classList.add('modal-open');
      loadExistingEntry();
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
        document.body.classList.remove('modal-open');
      }, 200);
    }
  }, [isOpen, loadExistingEntry]);

  useEffect(() => {
    if (isOpen) {
      loadExistingEntry();
    }
  }, [selectedDate, isOpen, loadExistingEntry]);

  const handleClose = () => {
    setWeight('');
    setHydration('');
    setMood(5);
    setSideEffects([]);
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setNotes('');
    onClose();
  };

  const addSideEffect = (name: string) => {
    if (!sideEffects.find(se => se.name === name)) {
      setSideEffects([...sideEffects, { name, severity: 5 }]);
    }
  };

  const removeSideEffect = (name: string) => {
    setSideEffects(sideEffects.filter(se => se.name !== name));
  };

  const updateSideEffectSeverity = (name: string, severity: number) => {
    setSideEffects(sideEffects.map(se => 
      se.name === name ? { ...se, severity } : se
    ));
  };

  const handleSave = async () => {
    const macros: WeightMacros | undefined = (calories || protein || carbs || fat)
      ? {
          calories: parseInt(calories) || 0,
          protein: parseInt(protein) || 0,
          carbs: parseInt(carbs) || 0,
          fat: parseInt(fat) || 0,
        }
      : undefined;

    const weightKg = weight ? convertWeightToKg(parseFloat(weight), useImperialWeight ? 'imperial' : 'metric') : undefined;
    const hydrationMl = hydration ? convertHydrationToMl(parseFloat(hydration), useOz ? 'oz' : 'ml') : undefined;

    const entry: DailyLogEntry = {
      date: selectedDate,
      weight: weightKg,
      hydration: hydrationMl,
      mood: mood || undefined,
      sideEffects: sideEffects.length > 0 ? sideEffects : undefined,
      calories: parseInt(calories) || undefined,
      macros,
      notes: notes || undefined,
    };

    await db.dailyLogs.put(entry);
    onSave(entry, weightKg);
    handleClose();
  };

  const getMoodEmoji = (value: number): string => {
    if (value <= 2) return '😢';
    if (value <= 4) return '😕';
    if (value <= 6) return '😐';
    if (value <= 8) return '🙂';
    return '😊';
  };

  const getMoodColor = (value: number): string => {
    if (value <= 3) return '#f87171';
    if (value <= 5) return '#facc15';
    if (value <= 7) return '#4ade80';
    return '#4ADEA8';
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div
        className={`fixed inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/40'} ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}
        style={{ backdropFilter: 'blur(8px)' }}
        onClick={handleClose}
      />
      <div className={`relative rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] p-4 sm:p-6 overflow-y-auto flex flex-col ${modal} ${isClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold ${modalText.title}`}>Quick Log</h2>
          <button
            onClick={handleClose}
            className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
          >
            <svg className={`w-6 h-6 ${modalText.title}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <label className={`block text-sm font-medium mb-2 ${modalText.label}`}>Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className={`border-t my-3 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${modalText.label}`}>Weight</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={`Enter weight (${weightUnit})`}
                className={inputStyle}
                step="0.1"
                min="0"
              />
              <button
                type="button"
                onClick={() => setUseImperialWeight(!useImperialWeight)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  useImperialWeight
                    ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white'
                    : isDarkMode
                      ? 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30'
                      : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                {weightUnit}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${modalText.label}`}>Hydration</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={hydration}
                onChange={(e) => setHydration(e.target.value)}
                placeholder={`Enter hydration (${getHydrationUnit(useOz ? 'oz' : 'ml')})`}
                className={inputStyle}
                step="1"
                min="0"
              />
              <button
                type="button"
                onClick={() => setUseOz(!useOz)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  useOz
                    ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white'
                    : isDarkMode
                      ? 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30'
                      : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                {getHydrationUnit(useOz ? 'oz' : 'ml')}
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={`text-sm font-medium ${modalText.label}`}>
                Mood (optional)
              </label>
              <span className="text-sm font-medium" style={{ color: getMoodColor(mood) }}>
                {getMoodEmoji(mood)} {mood}/10
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
              className="pain-slider w-full h-10 appearance-none cursor-pointer"
            />
            <div className="flex justify-between gap-1 mt-1">
              <span className="text-xs text-green-400">None</span>
              <span className="text-xs text-orange-400">Moderate</span>
              <span className="text-xs text-red-400">Severe</span>
            </div>
          </div>

          <div className={`border-t my-3 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

          <div className={`border-t my-3 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${modalText.label}`}>Side Effects</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_SIDE_EFFECTS.filter(se => !sideEffects.find(s => s.name === se)).map((se) => (
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
            {sideEffects.length > 0 && (
              <div className="space-y-3">
                {sideEffects.map((se) => (
                  <div key={se.name} className={`rounded-lg p-3 border ${
                    isDarkMode 
                      ? 'bg-black/20 border-[#B19CD9]/20' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{se.name}</span>
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

          <div className={`border-t my-3 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${modalText.label}`}>Calories</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="Enter calories"
              className={inputStyle}
              min="0"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${modalText.label}`}>Protein (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                className={inputStyle}
                min="0"
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${modalText.label}`}>Carbs (g)</label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                className={inputStyle}
                min="0"
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${modalText.label}`}>Fat (g)</label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="0"
                className={inputStyle}
                min="0"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${modalText.label}`}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              className={textarea}
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t border-card-border">
          <button
            onClick={handleClose}
            className={`flex-1 py-3 rounded-xl border transition-all font-medium ${
              isDarkMode
                ? 'border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white font-medium hover:shadow-[0_0_20px_rgba(74,222,168,0.5)] transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickLogModal;
