import React, { useState, useEffect } from 'react';
import { Peptide, PeptideLogEntry, InjectionRoute } from '../../../types';
import { generateId } from '../../../constants/medications';
import DateWheelPickerModal from '../../../shared/components/DateWheelPickerModal';
import CalendarPickerModal from '../../../shared/components/CalendarPickerModal';
import BottomSheetModal from '../../../shared/components/BottomSheetModal';
import { timeService } from '../../../core/timeService';
import { useTheme } from '../../../contexts/ThemeContext';

interface LogPeptideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: PeptideLogEntry) => void;
  peptide: Peptide | null;
  useWheelForDate?: boolean;
}

const INJECTION_SITES = [
  'Left Arm',
  'Right Arm', 
  'Left Thigh',
  'Right Thigh',
  'Left Stomach',
  'Right Stomach',
  'Left Hip',
  'Right Hip',
  'Buttock',
];

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

const LogPeptideModal: React.FC<LogPeptideModalProps> = ({ isOpen, onClose, onSave, peptide, useWheelForDate = true }) => {
  const { isDarkMode } = useTheme();
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState(() => {
    const now = timeService.nowDate();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [dose, setDose] = useState('');
  const [route, setRoute] = useState<InjectionRoute>('subcutaneous');
  const [injectionSite, setInjectionSite] = useState('Left Stomach');
  const [painLevel, setPainLevel] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showRoutePicker, setShowRoutePicker] = useState(false);

  useEffect(() => {
    if (isOpen && peptide) {
      setDose(peptide.dose.toString());
      setRoute(peptide.route);
      setDate(getTodayString());
      const now = timeService.nowDate();
      setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      setPainLevel(null);
      setNotes('');
    }
  }, [isOpen, peptide]);

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

  if (!isVisible || !peptide) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doseValue = parseFloat(dose);
    if (!doseValue || doseValue <= 0) return;

    const log: PeptideLogEntry = {
      id: generateId(),
      peptideId: peptide.id,
      date,
      time,
      dose: doseValue,
      doseUnit: 'mg',
      route,
      injectionSite,
      painLevel,
      notes,
      createdAt: new Date().toISOString(),
    };

    onSave(log);
    handleClose();
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
          className={`relative w-full max-w-sm max-h-[98vh] sm:max-h-[95vh] rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
            isDarkMode 
              ? 'border-[#4ADEA8]/30 bg-gradient-to-b from-[#1a1625]/95 to-[#0d0a15]/95'
              : 'border-gray-200 bg-white'
          } ${
            isClosing ? 'modal-fade-out' : 'modal-content-fade-in'
          }`}
          style={isDarkMode ? { boxShadow: '0 0 30px rgba(74, 222, 168, 0.3)' } : {}}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${
            isDarkMode ? 'border-[#4ADEA8]/20' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                style={{ backgroundColor: peptide.color }}
              />
              <h2 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Log {peptide.name}
              </h2>
            </div>
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date</label>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className={`w-full px-3 py-2 rounded-lg border text-left ${
                    isDarkMode
                      ? 'bg-white/10 border-[#4ADEA8]/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {date}
                </button>
              </div>
              <div>
                <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#4ADEA8]/50 ${
                    isDarkMode
                      ? 'bg-white/10 border-[#4ADEA8]/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            {/* Dose */}
            <div>
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dose (mg)</label>
              <input
                type="number"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder={peptide.dose.toString()}
                step="0.1"
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#4ADEA8]/50 ${
                  isDarkMode
                    ? 'bg-white/10 border-[#4ADEA8]/20 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                required
              />
            </div>

            {/* Route */}
            <div>
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Route</label>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowRoutePicker(true); }}
                className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between ${
                  isDarkMode
                    ? 'bg-white/10 border-[#4ADEA8]/20 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <span>{ROUTE_LABELS[route]}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Injection Site */}
            {['subcutaneous', 'intramuscular'].includes(route) && (
              <div>
                <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Injection Site</label>
                <div className="grid grid-cols-3 gap-2">
                  {INJECTION_SITES.map((site) => (
                    <button
                      key={site}
                      type="button"
                      onClick={() => setInjectionSite(site)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                        injectionSite === site 
                          ? 'bg-[#4ADEA8]/20 text-[#4ADEA8] border border-[#4ADEA8]/50' 
                          : isDarkMode
                            ? 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                            : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {site}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pain Level */}
            {['subcutaneous', 'intramuscular'].includes(route) && (
              <div>
                <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pain Level (optional)</label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPainLevel(painLevel === level ? null : level)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        painLevel === level 
                          ? level <= 3 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : level <= 6
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                              : 'bg-red-500/20 text-red-400 border border-red-500/50'
                          : isDarkMode
                            ? 'bg-white/5 text-gray-500 border border-transparent hover:bg-white/10'
                            : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any observations..."
                rows={2}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#4ADEA8]/50 resize-none ${
                  isDarkMode
                    ? 'bg-white/10 border-[#4ADEA8]/20 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
          </form>

          {/* Footer */}
          <div className={`p-3 sm:p-4 border-t flex gap-2 ${
            isDarkMode ? 'border-[#4ADEA8]/20' : 'border-gray-200'
          }`}>
            <button
              onClick={handleClose}
              className={`flex-1 py-2.5 sm:py-3 rounded-xl border font-medium transition-all ${
                isDarkMode
                  ? 'border-[#4ADEA8]/40 text-white/80 hover:text-white hover:bg-white/10'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#4ADEA8] to-[#6EE7B7] text-white font-semibold hover:shadow-[0_0_20px_rgba(74,222,168,0.5)] transition-all"
            >
              Log Injection
            </button>
          </div>
        </div>
      </div>

      {showDatePicker && (
        useWheelForDate ? (
          <DateWheelPickerModal
            isOpen={showDatePicker}
            value={date}
            onChange={(newDate) => {
              setDate(newDate);
              setShowDatePicker(false);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        ) : (
          <CalendarPickerModal
            isOpen={showDatePicker}
            value={date}
            onChange={(newDate) => {
              setDate(newDate);
              setShowDatePicker(false);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        )
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

export default LogPeptideModal;
