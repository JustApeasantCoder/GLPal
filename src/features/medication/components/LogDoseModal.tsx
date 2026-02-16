import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GLP1Entry, GLP1Protocol } from '../../../types';
import { timeService } from '../../../core/timeService';
import { addMedicationManualEntry } from '../../../shared/utils/database';

interface LogDoseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  protocol: GLP1Protocol | null;
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

const LogDoseModal: React.FC<LogDoseModalProps> = ({ isOpen, onClose, onSave, protocol }) => {
  const [painLevel, setPainLevel] = useState<number>(0);
  const [injectionArea, setInjectionArea] = useState<string>('');
  const [injectionSide, setInjectionSide] = useState<string>('');
  const [injectionPosition, setInjectionPosition] = useState<string>('');
  const [isr, setIsr] = useState<string>('None');
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

  if (!isVisible) return null;

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
    if (!protocol) return;

    const todayStr = timeService.nowDate().toISOString().split('T')[0];
    const injectionSite = getInjectionSiteString();
    
    const newEntry: GLP1Entry = {
      date: todayStr,
      medication: protocol.medication,
      dose: protocol.dose,
      halfLifeHours: protocol.halfLifeHours,
      isManual: true,
      time: currentTime,
      painLevel: painLevel > 0 ? painLevel : undefined,
      injectionSite: injectionSite || undefined,
      isr: isr !== 'None' ? isr : undefined,
    };

    addMedicationManualEntry(newEntry);
    onSave();
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
                : 'bg-black/20 border border-[#B19CD9]/30 text-text-muted hover:bg-[#B19CD9]/20 hover:border-[#B19CD9]/50'
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
      <div className={`relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto ${isClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
        <h2 className="text-xl font-semibold text-white mb-2">Log Dose</h2>
        <div className="border-t border-[#B19CD9]/20 mb-4"></div>

        <div className="space-y-3 mb-4">
          <div className="bg-black/20 rounded-lg p-3 border border-[#B19CD9]/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-text-secondary">Medication</span>
              <span className="text-sm font-medium text-text-primary">{protocol?.medication || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-text-secondary">Date</span>
              <span className="text-sm text-text-primary">{today}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-text-secondary">Time</span>
              <span className="text-sm font-medium text-text-primary">{currentTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Dose</span>
              <span className="text-sm font-medium text-[#4ADEA8]">{protocol?.dose || 0}mg</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#B19CD9]/20 mb-4"></div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text-secondary">
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

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
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
                <span className="text-sm bg-[#4ADEA8]/20 text-[#4ADEA8] px-3 py-1 rounded-lg">
                  Selected: {getInjectionSiteString()}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-[#B19CD9]/20 my-4"></div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
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
                      : 'bg-black/20 border border-[#B19CD9]/30 text-text-muted hover:bg-[#B19CD9]/20 hover:border-[#B19CD9]/50'
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#B19CD9]/20 my-4"></div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
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

export default LogDoseModal;
