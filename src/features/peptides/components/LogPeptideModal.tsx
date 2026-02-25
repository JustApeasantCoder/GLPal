import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Peptide, PeptideLogEntry } from '../../../types';
import { generateId } from '../../../constants/medications';
import { timeService } from '../../../core/timeService';
import { useTheme, useThemeStyles } from '../../../contexts/ThemeContext';

interface LogPeptideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: PeptideLogEntry) => void;
  peptide: Peptide | null;
}

const INJECTION_AREAS = ['Abdomen', 'Thigh', 'Arm', 'Buttock'];
const INJECTION_SIDES = ['Left', 'Right'];
const INJECTION_POSITIONS = ['Upper', 'Middle', 'Lower'];

const ISR_SEVERITY = [
  'None',
  'Mild',
  'Moderate',
  'Severe',
];

const getPainLevelColor = (level: number): string => {
  if (level === 0) return '#4ade80';
  if (level <= 3) return '#facc15';
  if (level <= 6) return '#fb923c';
  return '#f87171';
};

const LogPeptideModal: React.FC<LogPeptideModalProps> = ({ isOpen, onClose, onSave, peptide }) => {
  const { isDarkMode } = useTheme();
  const { inputButton, textarea, modal, modalText } = useThemeStyles();

  const [painLevel, setPainLevel] = useState<number>(0);
  const [injectionArea, setInjectionArea] = useState<string>('');
  const [injectionSide, setInjectionSide] = useState<string>('');
  const [injectionPosition, setInjectionPosition] = useState<string>('');
  const [isr, setIsr] = useState<string>('None');
  const [notes, setNotes] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const handlePainLevelChange = useCallback((value: number) => {
    setPainLevel(value);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const now = timeService.nowDate();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setPainLevel(0);
      setInjectionArea('');
      setInjectionSide('');
      setInjectionPosition('');
      setIsr('None');
      setNotes('');
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
  }, [isOpen, isVisible, isClosing]);

  const painLevelColor = useMemo(() => getPainLevelColor(painLevel), [painLevel]);

  if (!isOpen || !peptide) return null;

  const today = timeService.nowDate().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const getInjectionSiteString = () => {
    const parts = [];
    if (injectionSide) parts.push(injectionSide);
    if (injectionPosition) parts.push(injectionPosition);
    if (injectionArea) parts.push(injectionArea);
    return parts.join(' ');
  };

  const handleSave = () => {
    const log: PeptideLogEntry = {
      id: generateId(),
      peptideId: peptide.id,
      date: timeService.todayString(),
      time: currentTime,
      dose: peptide.dose,
      doseUnit: 'mg',
      route: peptide.route,
      injectionSite: getInjectionSiteString() || undefined,
      painLevel: painLevel > 0 ? painLevel : undefined,
      isr: isr !== 'None' ? isr : undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    onSave(log);
    onClose();
  };

  const renderSelector = (
    label: string,
    options: string[],
    selected: string,
    onSelect: (val: string) => void,
    cols: number = 4
  ) => (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">{label}</label>
      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(selected === opt ? '' : opt)}
            className={`py-2 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-[1.02] ${
              selected === opt
                ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_10px_rgba(177,156,217,0.4)]'
                : isDarkMode
                  ? 'bg-black/20 border border-[#B19CD9]/30 text-text-muted hover:bg-[#B19CD9]/20 hover:border-[#B19CD9]/50'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className={`fixed inset-0 bg-black/60 ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}
        style={{ backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <div className={`relative rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-2xl p-6 max-h-[90vh] overflow-y-auto pointer-events-auto ${modal} ${isClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: peptide.color }}
          />
          <h2 className={`text-xl font-semibold ${modalText.title}`}>Log {peptide.name}</h2>
        </div>
        <div className="border-t border-[#B19CD9]/20 mb-4"></div>

        {/* Peptide Info Card */}
        <div className="space-y-3 mb-4">
          <div className={`rounded-lg p-3 border ${
            isDarkMode 
              ? 'bg-black/20 border-[#B19CD9]/20' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm ${modalText.label}`}>Peptide</span>
              <span className="text-sm font-medium" style={{ color: peptide.color }}>{peptide.name}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm ${modalText.label}`}>Date</span>
              <span className={`text-sm ${modalText.value}`}>{today}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm ${modalText.label}`}>Time</span>
              <span className={`text-sm font-medium ${modalText.value}`}>{currentTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${modalText.label}`}>Dose</span>
              <span className="text-sm font-medium text-[#4ADEA8]">{peptide.dose}mg</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#B19CD9]/20 mb-4"></div>

        {/* Pain Level */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={`text-sm font-medium ${modalText.label}`}>
                Pain Level (optional)
              </label>
              <span className="pain-level-indicator text-sm font-medium" style={{ color: painLevelColor }}>
                {painLevel}/10
              </span>
            </div>
            <div className="flex flex-col">
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={painLevel}
                onChange={(e) => handlePainLevelChange(parseInt(e.target.value))}
                className="pain-slider w-full h-10 appearance-none cursor-pointer"
              />
              <div className="flex justify-between gap-1 mt-1">
                <span className="text-xs text-green-400">None</span>
                <span className="text-xs text-orange-400">Moderate</span>
                <span className="text-xs text-red-400">Severe</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-4"></div>

          {/* Injection Site */}
          <div>
            <label className={`block text-sm font-medium ${modalText.label} mb-2`}>
              Injection Site (optional)
            </label>
            {renderSelector('Area', INJECTION_AREAS, injectionArea, setInjectionArea, 4)}
            <div className="mt-2">
              {renderSelector('Side', INJECTION_SIDES, injectionSide, setInjectionSide, 2)}
            </div>
            <div className="mt-2">
              {renderSelector('Position', INJECTION_POSITIONS, injectionPosition, setInjectionPosition, 3)}
            </div>
            {getInjectionSiteString() && (
              <div className="mt-3 text-center">
                <span className="text-sm bg-[#B19CD9]/20 text-[#B19CD9] px-3 py-1 rounded-lg">
                  Selected: {getInjectionSiteString()}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-[#B19CD9]/20 my-4"></div>

          {/* ISR */}
          <div>
            <label className={`block text-sm font-medium ${modalText.label} mb-2`}>
              Injection Site Reaction (optional)
            </label>
            <div className="flex gap-2">
              {ISR_SEVERITY.map((severity) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => setIsr(severity)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-[1.02] ${
                    isr === severity
                      ? severity === 'None'
                        ? 'bg-gradient-to-r from-[#4ADEA8] to-[#6EE7B7] text-white shadow-[0_0_10px_rgba(74,222,168,0.4)]'
                        : severity === 'Mild'
                          ? 'bg-gradient-to-r from-[#EAB308] to-[#FACC15] text-white shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                          : severity === 'Moderate'
                            ? 'bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                            : 'bg-gradient-to-r from-[#EF4444] to-[#F87171] text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                      : isDarkMode
                        ? 'bg-black/20 border border-[#B19CD9]/30 text-text-muted hover:bg-[#B19CD9]/20 hover:border-[#B19CD9]/50'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#B19CD9]/20 my-4"></div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium ${modalText.label} mb-2`}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              className={textarea}
              rows={2}
            />
          </div>
        </div>

        <div className="border-t border-[#B19CD9]/20 my-4"></div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl border transition-all font-medium ${
              isDarkMode
                ? 'border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white hover:shadow-[0_0_20px_rgba(74,222,168,0.5)]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogPeptideModal;
