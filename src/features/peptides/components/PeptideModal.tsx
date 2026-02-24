import React, { useState, useEffect } from 'react';
import { Peptide, PEPTIDE_PRESETS, PeptideCategory, PeptideFrequency, InjectionRoute, PeptideCycle } from '../../../types';
import { generateId } from '../../../constants/medications';
import DateWheelPickerModal from '../../../shared/components/DateWheelPickerModal';
import CalendarPickerModal from '../../../shared/components/CalendarPickerModal';
import BottomSheetModal from '../../../shared/components/BottomSheetModal';
import { timeService } from '../../../core/timeService';
import { useTheme } from '../../../contexts/ThemeContext';

interface PeptideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (peptide: Peptide) => void;
  editPeptide?: Peptide | null;
  useWheelForDate?: boolean;
}

const CATEGORY_COLORS: Record<PeptideCategory, string> = {
  healing: '#EF4444',
  growth_hormone: '#F59E0B',
  fat_loss: '#10B981',
  muscle: '#3B82F6',
  longevity: '#8B5CF6',
  immune: '#EC4899',
  skin: '#F472B6',
  cognitive: '#06B6D4',
  other: '#6B7280',
};

const CATEGORY_LABELS: Record<PeptideCategory, string> = {
  healing: 'Healing',
  growth_hormone: 'GH',
  fat_loss: 'Fat Loss',
  muscle: 'Muscle',
  longevity: 'Longevity',
  immune: 'Immune',
  skin: 'Skin',
  cognitive: 'Cognitive',
  other: 'Other',
};

const FREQUENCY_LABELS: Record<PeptideFrequency, string> = {
  daily: 'Everyday',
  every_other_day: 'Every 2 Days',
  every_3_days: 'Every 3 Days',
  every_35_days: 'Every 3.5 Days',
  every_4_days: 'Every 4 Days',
  every_5_days: 'Every 5 Days',
  every_6_days: 'Every 6 Days',
  weekly: 'Every Week',
  twice_week: '2x / Week',
  biweekly: 'Every 2 Weeks',
  triweekly: 'Every 3 Weeks',
  monthly: 'Every Month',
  as_needed: 'As Needed',
};

const ROUTE_LABELS: Record<InjectionRoute, string> = {
  subcutaneous: 'Subcutaneous (SQ)',
  intramuscular: 'Intramuscular (IM)',
  intravenous: 'IV',
  oral: 'Oral',
  topical: 'Topical',
  intranasal: 'Intranasal',
  sublingual: 'Sublingual',
};

const getTodayString = () => timeService.todayString();

const PeptideModal: React.FC<PeptideModalProps> = ({ isOpen, onClose, onSave, editPeptide, useWheelForDate = true }) => {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PeptideCategory>('other');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState<PeptideFrequency>('daily');
  const [preferredTime, setPreferredTime] = useState('08:00');
  const [route, setRoute] = useState<InjectionRoute>('subcutaneous');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS.other);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [showPresets, setShowPresets] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [contentKey, setContentKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (editPeptide) {
        setName(editPeptide.name);
        setCategory(editPeptide.category);
        setDose(editPeptide.dose.toString());
        setFrequency(editPeptide.frequency);
        setPreferredTime(editPeptide.preferredTime || '08:00');
        setRoute(editPeptide.route);
        setStartDate(editPeptide.startDate);
        setEndDate(editPeptide.endDate);
        setNotes(editPeptide.notes);
        setColor(editPeptide.color);
        setShowPresets(false);
      } else {
        setName('');
        setCategory('other');
        setDose('');
        setFrequency('daily');
        setPreferredTime('08:00');
        setRoute('subcutaneous');
        setStartDate(getTodayString());
        setEndDate(null);
        setNotes('');
        setColor(CATEGORY_COLORS.other);
        setShowPresets(true);
      }
    }
  }, [isOpen, editPeptide]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    document.body.classList.remove('modal-open');
    const timer = setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
    }, 200);
    return () => clearTimeout(timer);
  };

  if (!isVisible) return null;

  const handlePresetSelect = (preset: typeof PEPTIDE_PRESETS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setDose(preset.defaultDose.toString());
    setFrequency(preset.defaultFrequency);
    setPreferredTime(preset.defaultPreferredTime || '08:00');
    setRoute(preset.defaultRoute);
    setColor(CATEGORY_COLORS[preset.category]);
    setShowPresets(false);
    setContentKey(prev => prev + 1);
  };

  const handleCategoryChange = (cat: PeptideCategory) => {
    setCategory(cat);
    setColor(CATEGORY_COLORS[cat]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doseValue = parseFloat(dose);

    if (!name.trim()) return;

    const peptide: Peptide = {
      id: editPeptide?.id || generateId(),
      name: name.trim(),
      category,
      dose: doseValue,
      doseUnit: 'mg',
      frequency,
      preferredTime,
      route,
      startDate,
      endDate,
      halfLifeHours: 0,
      notes,
      color,
      isActive: true,
      isArchived: editPeptide?.isArchived || false,
      createdAt: editPeptide?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cycles: editPeptide?.cycles || [],
    };

    onSave(peptide);
    handleClose();
  };

  const openDatePicker = (type: 'start' | 'end') => {
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
        <div 
          className={`fixed inset-0 bg-black/60 ${
            isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'
          }`}
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={handleClose} 
        />
        <div 
          className={`relative w-full max-w-sm max-h-[90vh] rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
            isDarkMode 
              ? 'border-[#B19CD9]/30 bg-gradient-to-b from-[#1a1625]/95 to-[#0d0a15]/95'
              : 'border-gray-200 bg-white'
          } ${
            isClosing ? 'modal-fade-out' : 'modal-content-fade-in'
          }`}
          style={isDarkMode ? { boxShadow: '0 0 30px rgba(177, 156, 217, 0.3)' } : {}}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${
            isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'
          }`}>
            <h2 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {editPeptide ? 'Edit Peptide' : 'Add Peptide'}
            </h2>
            <button
              onClick={handleClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6M6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          {/* Use a reliable fade-in animation when content switches (presets -> form) */}
          <div key={contentKey} className="flex-1 overflow-y-auto p-4 space-y-4 tab-fade-in">
            {showPresets && !editPeptide ? (
              <div className="space-y-3">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quick select a peptide preset:</p>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {PEPTIDE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        isDarkMode
                          ? 'bg-white/5 hover:bg-white/10 border-[#B19CD9]/20 hover:border-[#B19CD9]/40'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[preset.category] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{preset.name}</p>
                        <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{preset.description}</p>
                      </div>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{preset.defaultDose}{preset.defaultDoseUnit}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleClose}
                  className={`w-full py-2 text-sm transition-colors ${
                    isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                  }`}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Peptide Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., BPC-157"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-[#B19CD9]/50 ${
                      isDarkMode
                        ? 'bg-black/20 border-[#B19CD9]/30 text-[#B19CD9] placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Category</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(CATEGORY_COLORS) as PeptideCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryChange(cat)}
                        className={`flex-1 min-w-[70px] px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                        category === cat 
                            ? 'text-white shadow-[0_0_10px_rgba(177,156,217,0.4)]' 
                            : isDarkMode
                              ? 'bg-black/20 border border-[#B19CD9]/30 text-gray-400 hover:bg-[#B19CD9]/20 hover:border-[#B19CD9]/50'
                              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                        }`}
                        style={{ 
                          borderColor: category === cat ? CATEGORY_COLORS[cat] : 'transparent',
                          borderWidth: '2px',
                          background: category === cat 
                            ? `linear-gradient(to right, ${CATEGORY_COLORS[cat]}, ${CATEGORY_COLORS[cat]}80)`
                            : undefined
                        }}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dose & Frequency */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dose (mg)</label>
                    <input
                      type="number"
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                      placeholder="0.5"
                      step="0.1"
                      className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-[#B19CD9]/50 ${
                        isDarkMode
                          ? 'bg-black/20 border-[#B19CD9]/30 text-[#B19CD9] placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dosing Schedule</label>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setShowFrequencyPicker(true); }}
                      className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between text-sm ${
                        isDarkMode
                          ? 'bg-black/20 border-[#B19CD9]/30 text-[#B19CD9]'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <span>{FREQUENCY_LABELS[frequency]}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Preferred Time */}
                <div>
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Preferred Time</label>
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-[#B19CD9]/50 ${
                      isDarkMode
                        ? 'bg-black/20 border-[#B19CD9]/30 text-[#B19CD9]'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    You'll be reminded around this time
                  </p>
                </div>

                {/* Route */}
                <div>
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Injection Route</label>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowRoutePicker(true); }}
                    className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between text-sm ${
                      isDarkMode
                        ? 'bg-black/20 border-[#B19CD9]/30 text-[#B19CD9]'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <span>{ROUTE_LABELS[route]}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start Date</label>
                    <button
                      type="button"
                      onClick={() => openDatePicker('start')}
                      className={`w-full px-3 py-2 rounded-lg border text-left text-sm ${
                        isDarkMode
                          ? 'bg-black/20 border-[#B19CD9]/30 text-[#B19CD9]'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {startDate}
                    </button>
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>End Date (optional)</label>
                    <button
                      type="button"
                      onClick={() => openDatePicker('end')}
                      className={`w-full px-3 py-2 rounded-lg border text-left text-sm ${
                        isDarkMode
                          ? 'bg-black/20 border-[#B19CD9]/30 text-[#B19CD9]'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {endDate || 'Ongoing'}
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-[#B19CD9]/50 resize-none ${
                      isDarkMode
                        ? 'bg-black/20 border-[#B19CD9]/30 text-[#B19CD9] placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Color */}
                <div>
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Color</label>
                  <div className="flex gap-2">
                    {Object.values(CATEGORY_COLORS).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          {!showPresets && (
            <div className={`p-3 sm:p-4 border-t flex gap-2 ${
              isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'
            }`}>
              <button
                onClick={handleClose}
                className={`flex-1 py-2.5 sm:py-3 rounded-xl border font-medium transition-all ${
                  isDarkMode
                    ? 'border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-semibold hover:shadow-[0_0_20px_rgba(177,156,217,0.5)] transition-all"
              >
                {editPeptide ? 'Update' : 'Add Peptide'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showDatePicker && (
        useWheelForDate ? (
          <DateWheelPickerModal
            isOpen={showDatePicker}
            value={datePickerType === 'start' ? startDate : (endDate || getTodayString())}
            onChange={(date) => {
              if (datePickerType === 'start') {
                setStartDate(date);
              } else {
                setEndDate(date);
              }
              setShowDatePicker(false);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        ) : (
          <CalendarPickerModal
            isOpen={showDatePicker}
            value={datePickerType === 'start' ? startDate : (endDate || getTodayString())}
            onChange={(date) => {
              if (datePickerType === 'start') {
                setStartDate(date);
              } else {
                setEndDate(date);
              }
              setShowDatePicker(false);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        )
      )}

      {showFrequencyPicker && (
        <BottomSheetModal
          isOpen={showFrequencyPicker}
          title="Select Dosing Schedule"
          options={Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))}
          value={frequency}
          onSelect={(val) => {
            setFrequency(val as PeptideFrequency);
            setShowFrequencyPicker(false);
          }}
          onClose={() => setShowFrequencyPicker(false)}
        />
      )}

      {showRoutePicker && (
        <BottomSheetModal
          isOpen={showRoutePicker}
          title="Select Route"
          options={Object.entries(ROUTE_LABELS).map(([value, label]) => ({ value, label }))}
          value={route}
          onSelect={(val) => {
            setRoute(val as InjectionRoute);
            setShowRoutePicker(false);
          }}
          onClose={() => setShowRoutePicker(false)}
        />
      )}
    </>
  );
};

export default PeptideModal;
