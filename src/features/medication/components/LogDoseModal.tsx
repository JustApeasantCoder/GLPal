import React, { useState, useEffect } from 'react';
import { GLP1Entry, GLP1Protocol } from '../../../types';
import { timeService } from '../../../core/timeService';
import { addMedicationManualEntry } from '../../../shared/utils/database';

interface LogDoseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  protocol: GLP1Protocol | null;
}

const INJECTION_SITES = [
  'Abdomen (left)',
  'Abdomen (right)',
  'Thigh (left)',
  'Thigh (right)',
  'Arm (left)',
  'Arm (right)',
];

const ISR_SEVERITY = [
  'None',
  'Mild',
  'Moderate',
  'Severe',
];

const LogDoseModal: React.FC<LogDoseModalProps> = ({ isOpen, onClose, onSave, protocol }) => {
  const [painLevel, setPainLevel] = useState<number>(0);
  const [injectionSite, setInjectionSite] = useState<string>('');
  const [isr, setIsr] = useState<string>('None');
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const now = timeService.nowDate();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setPainLevel(0);
      setInjectionSite('');
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
  }, [isOpen]);

  if (!isVisible) return null;

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleSave = () => {
    if (!protocol) return;

    const todayStr = new Date().toISOString().split('T')[0];
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className={`fixed inset-0 bg-black/60 ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}
        style={{ backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <div className={`relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-sm p-6 ${isClosing ? 'modal-fade-out' : 'modal-content-fade-in'}`}>
        <h2 className="text-xl font-semibold text-white mb-2">Log Dose</h2>
        <div className="border-t border-[#B19CD9]/20 mb-4"></div>

        <div className="space-y-3 mb-4">
          <div className="bg-black/20 rounded-lg p-3 border border-[#B19CD9]/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-text-muted">Medication</span>
              <span className="text-sm font-medium text-white">{protocol?.medication || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-text-muted">Date</span>
              <span className="text-sm text-white">{today}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-text-muted">Time</span>
              <span className="text-sm text-white">{currentTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">Dose</span>
              <span className="text-sm font-medium text-[#4ADEA8]">{protocol?.dose || 0}mg</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#B19CD9]/20 mb-4"></div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Pain Level (optional)
            </label>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPainLevel(level)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    painLevel === level
                      ? 'bg-[#EF4444]/50 border border-[#EF4444] text-white'
                      : 'bg-black/20 border border-transparent text-text-muted hover:bg-[#EF4444]/10'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Injection Site (optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INJECTION_SITES.map((site) => (
                <button
                  key={site}
                  type="button"
                  onClick={() => setInjectionSite(site)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    injectionSite === site
                      ? 'bg-[#B19CD9]/30 border border-[#B19CD9] text-white'
                      : 'bg-black/20 border border-transparent text-text-muted hover:bg-[#B19CD9]/10'
                  }`}
                >
                  {site}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Injection Site Reaction (optional)
            </label>
            <div className="flex gap-1">
              {ISR_SEVERITY.map((severity) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => setIsr(severity)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    isr === severity
                      ? severity === 'None'
                        ? 'bg-[#4ADEA8]/50 border border-[#4ADEA8] text-white'
                        : severity === 'Mild'
                          ? 'bg-yellow-500/50 border border-yellow-500 text-white'
                          : severity === 'Moderate'
                            ? 'bg-orange-500/50 border border-orange-500 text-white'
                            : 'bg-red-500/50 border border-red-500 text-white'
                      : 'bg-black/20 border border-transparent text-text-muted hover:bg-[#B19CD9]/10'
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
