import React, { useState, useEffect, useCallback } from 'react';
import { useThemeStyles } from '../../../contexts/ThemeContext';
import { DailyLogEntry, SideEffect, WeightMacros, UserProfile } from '../../../types';
import { db } from '../../../db/dexie';
import { timeService } from '../../../core/timeService';
import { convertWeightToKg, convertWeightFromKg, getWeightUnit, convertHydrationToMl, convertHydrationFromMl, getHydrationUnit } from '../../../shared/utils/unitConversion';
import DateWheelPickerModal from '../../../shared/components/DateWheelPickerModal';
import WeightWheelPickerModal from '../../weight/components/WeightWheelPickerModal';
import DoseWheelPickerModal from '../../../shared/components/DoseWheelPickerModal';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: DailyLogEntry, weightKg?: number) => void;
  profile: UserProfile;
  initialDate?: string;
  useWheelForNumbers?: boolean;
  useWheelForDate?: boolean;
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
  useWheelForNumbers = true,
  useWheelForDate = false,
}) => {
  const { isDarkMode, inputButton } = useThemeStyles();
  const { modal, modalText, input: inputStyle, textarea } = useThemeStyles();
  
  const unitSystem = profile.unitSystem || 'metric';
  const hydrationUnit = profile.hydrationUnit || 'ml';
  const weightUnit = getWeightUnit(unitSystem);

  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [selectedDate, setSelectedDate] = useState(timeService.todayString());
  const [weight, setWeight] = useState('');
  const [hydration, setHydration] = useState('');
  const [mood, setMood] = useState(5);
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([]);
  const [newSideEffect, setNewSideEffect] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [showHydrationPicker, setShowHydrationPicker] = useState(false);
  const [showCaloriePicker, setShowCaloriePicker] = useState(false);
  const [showProteinPicker, setShowProteinPicker] = useState(false);
  const [showCarbsPicker, setShowCarbsPicker] = useState(false);
  const [showFatPicker, setShowFatPicker] = useState(false);

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  const loadExistingEntry = useCallback(async () => {
    const existing = await db.dailyLogs.get(selectedDate);
    if (existing) {
      if (existing.weight !== undefined) {
        setWeight(String(convertWeightFromKg(existing.weight, unitSystem)));
      }
      if (existing.hydration !== undefined) {
        setHydration(String(convertHydrationFromMl(existing.hydration, hydrationUnit)));
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
  }, [selectedDate, unitSystem, hydrationUnit]);

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

    const weightKg = weight ? convertWeightToKg(parseFloat(weight), unitSystem) : undefined;
    const hydrationMl = hydration ? convertHydrationToMl(parseFloat(hydration), hydrationUnit) : undefined;

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
            {useWheelForDate ? (
              <button
                type="button"
                onClick={() => setShowDatePicker(true)}
                className={inputButton}
              >
                {selectedDate || 'Tap to select'}
              </button>
            ) : (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={inputStyle}
              />
            )}
          </div>

          {showDatePicker && useWheelForDate && (
            <DateWheelPickerModal
              isOpen={showDatePicker}
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setShowDatePicker(false);
              }}
              onClose={() => setShowDatePicker(false)}
            />
          )}

          <div className={`border-t my-3 ${isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'}`}></div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${modalText.label}`}>Weight ({weightUnit})</label>
            {useWheelForNumbers ? (
              <button
                type="button"
                onClick={() => setShowWeightPicker(true)}
                className={inputButton}
              >
                {weight || 'Tap to select'}
              </button>
            ) : (
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={`Enter weight (${weightUnit})`}
                className={inputStyle}
                step="0.1"
                min="0"
              />
            )}
          </div>

          {showWeightPicker && (
            <WeightWheelPickerModal
              isOpen={showWeightPicker}
              onSave={(value) => {
                setWeight(value);
                setShowWeightPicker(false);
              }}
              onClose={() => setShowWeightPicker(false)}
              decimals={1}
              defaultValue={weight || ''}
              label="Select Weight"
            />
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 ${modalText.label}`}>Hydration ({getHydrationUnit(hydrationUnit)})</label>
            {useWheelForNumbers ? (
              <button
                type="button"
                onClick={() => setShowHydrationPicker(true)}
                className={inputButton}
              >
                {hydration || 'Tap to select'}
              </button>
            ) : (
              <input
                type="number"
                value={hydration}
                onChange={(e) => setHydration(e.target.value)}
                placeholder={`Enter hydration (${getHydrationUnit(hydrationUnit)})`}
                className={inputStyle}
                step="1"
                min="0"
              />
            )}
          </div>

          {showHydrationPicker && (
            <DoseWheelPickerModal
              isOpen={showHydrationPicker}
              onSave={(value) => {
                setHydration(value);
                setShowHydrationPicker(false);
              }}
              onClose={() => setShowHydrationPicker(false)}
              decimals={0}
              defaultValue={hydration || '0'}
              label="Select Hydration"
              min={0}
              max={5000}
              step={1}
            />
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={`text-sm font-medium ${modalText.label}`}>
                Mood
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
              <span className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Low</span>
              <span className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Okay</span>
              <span className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Great</span>
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
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>{se.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSideEffect(se.name)}
                        className={`text-xs ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'}`}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mild</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={se.severity}
                        onChange={(e) => updateSideEffectSeverity(se.name, parseInt(e.target.value))}
                        className="pain-slider flex-1 h-10 appearance-none cursor-pointer"
                      />
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Severe</span>
                    </div>
                    <div className="text-center mt-1">
                      <span className={`text-xs font-medium ${
                        se.severity <= 3 ? (isDarkMode ? 'text-green-400' : 'text-green-600') :
                        se.severity <= 6 ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') :
                        isDarkMode ? 'text-red-400' : 'text-red-600'
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
            {useWheelForNumbers ? (
              <button
                type="button"
                onClick={() => setShowCaloriePicker(true)}
                className={inputButton}
              >
                {calories || 'Tap to select'}
              </button>
            ) : (
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="Enter calories"
                className={inputStyle}
                min="0"
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${modalText.label}`}>Protein (g)</label>
              {useWheelForNumbers ? (
                <button
                  type="button"
                  onClick={() => setShowProteinPicker(true)}
                  className={inputButton}
                >
                  {protein || '0'}
                </button>
              ) : (
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className={inputStyle}
                  min="0"
                />
              )}
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${modalText.label}`}>Carbs (g)</label>
              {useWheelForNumbers ? (
                <button
                  type="button"
                  onClick={() => setShowCarbsPicker(true)}
                  className={inputButton}
                >
                  {carbs || '0'}
                </button>
              ) : (
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  className={inputStyle}
                  min="0"
                />
              )}
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${modalText.label}`}>Fat (g)</label>
              {useWheelForNumbers ? (
                <button
                  type="button"
                  onClick={() => setShowFatPicker(true)}
                  className={inputButton}
                >
                  {fat || '0'}
                </button>
              ) : (
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  className={inputStyle}
                  min="0"
                />
              )}
            </div>
          </div>

          {showCaloriePicker && (
            <DoseWheelPickerModal
              isOpen={showCaloriePicker}
              onSave={(value) => {
                setCalories(value);
                setShowCaloriePicker(false);
              }}
              onClose={() => setShowCaloriePicker(false)}
              decimals={0}
              defaultValue={calories || '0'}
              label="Select Calories"
              min={0}
              max={10000}
              step={1}
            />
          )}

          {showProteinPicker && (
            <DoseWheelPickerModal
              isOpen={showProteinPicker}
              onSave={(value) => {
                setProtein(value);
                setShowProteinPicker(false);
              }}
              onClose={() => setShowProteinPicker(false)}
              decimals={0}
              defaultValue={protein || '0'}
              label="Select Protein"
              min={0}
              max={500}
              step={1}
            />
          )}

          {showCarbsPicker && (
            <DoseWheelPickerModal
              isOpen={showCarbsPicker}
              onSave={(value) => {
                setCarbs(value);
                setShowCarbsPicker(false);
              }}
              onClose={() => setShowCarbsPicker(false)}
              decimals={0}
              defaultValue={carbs || '0'}
              label="Select Carbs"
              min={0}
              max={1000}
              step={1}
            />
          )}

          {showFatPicker && (
            <DoseWheelPickerModal
              isOpen={showFatPicker}
              onSave={(value) => {
                setFat(value);
                setShowFatPicker(false);
              }}
              onClose={() => setShowFatPicker(false)}
              decimals={0}
              defaultValue={fat || '0'}
              label="Select Fat"
              min={0}
              max={500}
              step={1}
            />
          )}

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
