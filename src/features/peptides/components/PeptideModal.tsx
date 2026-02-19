import React, { useState, useEffect } from 'react';
import { Peptide, PEPTIDE_PRESETS, PeptideCategory, PeptideFrequency, InjectionRoute, DoseUnit, PeptideCycle } from '../../../types';
import { generateId } from '../../../constants/medications';
import DateWheelPickerModal from '../../../shared/components/DateWheelPickerModal';
import { timeService } from '../../../core/timeService';
import { useTheme } from '../../../contexts/ThemeContext';

interface PeptideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (peptide: Peptide) => void;
  editPeptide?: Peptide | null;
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
  growth_hormone: 'Growth Hormone',
  fat_loss: 'Fat Loss',
  muscle: 'Muscle',
  longevity: 'Longevity',
  immune: 'Immune',
  skin: 'Skin',
  cognitive: 'Cognitive',
  other: 'Other',
};

const FREQUENCY_LABELS: Record<PeptideFrequency, string> = {
  daily: 'Daily',
  every_other_day: 'Every Other Day',
  twice_daily: 'Twice Daily',
  three_times_week: '3x / Week',
  twice_week: '2x / Week',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
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

const PeptideModal: React.FC<PeptideModalProps> = ({ isOpen, onClose, onSave, editPeptide }) => {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PeptideCategory>('other');
  const [dose, setDose] = useState('');
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('mg');
  const [frequency, setFrequency] = useState<PeptideFrequency>('daily');
  const [route, setRoute] = useState<InjectionRoute>('subcutaneous');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState<string | null>(null);
  const [halfLifeHours, setHalfLifeHours] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS.other);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [showPresets, setShowPresets] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editPeptide) {
        setName(editPeptide.name);
        setCategory(editPeptide.category);
        setDose(editPeptide.dose.toString());
        setDoseUnit(editPeptide.doseUnit);
        setFrequency(editPeptide.frequency);
        setRoute(editPeptide.route);
        setStartDate(editPeptide.startDate);
        setEndDate(editPeptide.endDate);
        setHalfLifeHours(editPeptide.halfLifeHours.toString());
        setNotes(editPeptide.notes);
        setColor(editPeptide.color);
        setShowPresets(false);
      } else {
        setName('');
        setCategory('other');
        setDose('');
        setDoseUnit('mg');
        setFrequency('daily');
        setRoute('subcutaneous');
        setStartDate(getTodayString());
        setEndDate(null);
        setHalfLifeHours('');
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
      document.body.classList.add('modal-open');
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
        document.body.classList.remove('modal-open');
      }, 200);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const handlePresetSelect = (preset: typeof PEPTIDE_PRESETS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setDose(preset.defaultDose.toString());
    setDoseUnit(preset.defaultDoseUnit);
    setFrequency(preset.defaultFrequency);
    setRoute(preset.defaultRoute);
    setHalfLifeHours(preset.halfLifeHours.toString());
    setColor(CATEGORY_COLORS[preset.category]);
    setShowPresets(false);
  };

  const handleCategoryChange = (cat: PeptideCategory) => {
    setCategory(cat);
    setColor(CATEGORY_COLORS[cat]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doseValue = parseFloat(dose);
    const halfLifeValue = parseFloat(halfLifeHours) || 0;

    if (!name.trim()) return;

    const peptide: Peptide = {
      id: editPeptide?.id || generateId(),
      name: name.trim(),
      category,
      dose: doseValue,
      doseUnit,
      frequency,
      route,
      startDate,
      endDate,
      halfLifeHours: halfLifeValue,
      notes,
      color,
      isActive: true,
      isArchived: editPeptide?.isArchived || false,
      createdAt: editPeptide?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cycles: editPeptide?.cycles || [],
    };

    onSave(peptide);
    onClose();
  };

  const openDatePicker = (type: 'start' | 'end') => {
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ animation: isClosing ? 'fadeOut 0.2s ease-out' : 'fadeIn 0.2s ease-out' }}
      >
        <div 
          className="fixed inset-0 bg-black/60" 
          style={{ backdropFilter: 'blur(8px)', animation: isClosing ? 'fadeOut 0.2s ease-out' : 'fadeIn 0.2s ease-out' }} 
          onClick={onClose} 
        />
        <div 
          className={`relative rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col ${
            isDarkMode 
              ? 'bg-gradient-to-b from-[#1a1625]/98 to-[#0d0a15]/98' 
              : 'bg-white/95'
          }`}
          style={{ animation: isClosing ? 'slideDown 0.2s ease-out' : 'slideUp 0.2s ease-out' }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'border-[#B19CD9]/20' : 'border-gray-200'
          }`}>
            <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {editPeptide ? 'Edit Peptide' : 'Add Peptide'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="L18 6M6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  onClick={() => setShowPresets(false)}
                  className={`w-full py-2 text-sm transition-colors ${
                    isDarkMode ? 'text-[#B19CD9] hover:text-white' : 'text-[#9C7BD3] hover:text-gray-900'
                  }`}
                >
                  Or create custom peptide →
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
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#B19CD9]/50 ${
                      isDarkMode
                        ? 'bg-white/10 border-[#B19CD9]/20 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(CATEGORY_COLORS) as PeptideCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryChange(cat)}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                        category === cat 
                            ? 'bg-white/20 text-white border-2' 
                            : isDarkMode
                              ? 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                              : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                        }`}
                        style={{ borderColor: category === cat ? CATEGORY_COLORS[cat] : 'transparent' }}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dose & Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dose</label>
                    <input
                      type="number"
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                      placeholder="500"
                      step="0.1"
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#B19CD9]/50 ${
                        isDarkMode
                          ? 'bg-white/10 border-[#B19CD9]/20 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unit</label>
                    <select
                      value={doseUnit}
                      onChange={(e) => setDoseUnit(e.target.value as DoseUnit)}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#B19CD9]/50 ${
                        isDarkMode
                          ? 'bg-white/10 border-[#B19CD9]/20 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="mg">mg</option>
                      <option value="mcg">mcg</option>
                      <option value="iu">IU</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as PeptideFrequency)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#B19CD9]/50 ${
                      isDarkMode
                        ? 'bg-white/10 border-[#B19CD9]/20 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Route */}
                <div>
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Injection Route</label>
                  <select
                    value={route}
                    onChange={(e) => setRoute(e.target.value as InjectionRoute)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#B19CD9]/50 ${
                      isDarkMode
                        ? 'bg-white/10 border-[#B19CD9]/20 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {Object.entries(ROUTE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start Date</label>
                    <button
                      type="button"
                      onClick={() => openDatePicker('start')}
                      className={`w-full px-3 py-2 rounded-lg border text-left ${
                        isDarkMode
                          ? 'bg-white/10 border-[#B19CD9]/20 text-white'
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
                      className={`w-full px-3 py-2 rounded-lg border text-left ${
                        isDarkMode
                          ? 'bg-white/10 border-[#B19CD9]/20 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {endDate || 'Ongoing'}
                    </button>
                  </div>
                </div>

                {/* Half Life */}
                <div>
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Half Life (hours)</label>
                  <input
                    type="number"
                    value={halfLifeHours}
                    onChange={(e) => setHalfLifeHours(e.target.value)}
                    placeholder="e.g., 4"
                    step="0.1"
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#B19CD9]/50 ${
                      isDarkMode
                        ? 'bg-white/10 border-[#B19CD9]/20 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#B19CD9]/50 resize-none ${
                      isDarkMode
                        ? 'bg-white/10 border-[#B19CD9]/20 text-white placeholder-gray-500'
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
            <div className="p-4 border-t border-[#B19CD9]/20">
              <button
                onClick={handleSubmit}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B19CD9] to-[#D4B8E8] text-white font-semibold hover:shadow-lg hover:shadow-[#B19CD9]/30 transition-all"
              >
                {editPeptide ? 'Update Peptide' : 'Add Peptide'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showDatePicker && (
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
      )}
    </>
  );
};

export default PeptideModal;
