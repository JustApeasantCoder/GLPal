import React, { useState, useEffect } from 'react';
import { Peptide, PeptideLogEntry, InjectionRoute } from '../../../types';
import { generateId } from '../../../constants/medications';
import DateWheelPickerModal from '../../../shared/components/DateWheelPickerModal';
import { timeService } from '../../../core/timeService';

interface LogPeptideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: PeptideLogEntry) => void;
  peptide: Peptide | null;
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

const LogPeptideModal: React.FC<LogPeptideModalProps> = ({ isOpen, onClose, onSave, peptide }) => {
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [dose, setDose] = useState('');
  const [doseUnit, setDoseUnit] = useState<string>('mg');
  const [route, setRoute] = useState<InjectionRoute>('subcutaneous');
  const [injectionSite, setInjectionSite] = useState('Left Stomach');
  const [painLevel, setPainLevel] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen && peptide) {
      setDose(peptide.dose.toString());
      setDoseUnit(peptide.doseUnit);
      setRoute(peptide.route);
      setDate(getTodayString());
      const now = new Date();
      setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      setPainLevel(null);
      setNotes('');
    }
  }, [isOpen, peptide]);

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
      doseUnit: doseUnit as 'mg' | 'mcg' | 'iu' | 'ml',
      route,
      injectionSite,
      painLevel,
      notes,
      createdAt: new Date().toISOString(),
    };

    onSave(log);
    onClose();
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
          className="relative bg-gradient-to-b from-[#1a1625]/98 to-[#0d0a15]/98 rounded-2xl shadow-2xl border border-[#4ADEA8]/30 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
          style={{ animation: isClosing ? 'slideDown 0.2s ease-out' : 'slideUp 0.2s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#4ADEA8]/20">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: peptide.color }}
              />
              <h2 className="text-lg font-bold text-white">
                Log {peptide.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6M6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date</label>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-[#4ADEA8]/20 text-white text-left"
                >
                  {date}
                </button>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-[#4ADEA8]/20 text-white focus:outline-none focus:border-[#4ADEA8]/50"
                />
              </div>
            </div>

            {/* Dose */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Dose</label>
                <input
                  type="number"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder={peptide.dose.toString()}
                  step="0.1"
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-[#4ADEA8]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#4ADEA8]/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Unit</label>
                <select
                  value={doseUnit}
                  onChange={(e) => setDoseUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-[#4ADEA8]/20 text-white focus:outline-none focus:border-[#4ADEA8]/50"
                >
                  <option value="mg">mg</option>
                  <option value="mcg">mcg</option>
                  <option value="iu">IU</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>

            {/* Route */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Route</label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value as InjectionRoute)}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-[#4ADEA8]/20 text-white focus:outline-none focus:border-[#4ADEA8]/50"
              >
                {Object.entries(ROUTE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Injection Site */}
            {['subcutaneous', 'intramuscular'].includes(route) && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Injection Site</label>
                <div className="grid grid-cols-3 gap-2">
                  {INJECTION_SITES.map((site) => (
                    <button
                      key={site}
                      type="button"
                      onClick={() => setInjectionSite(site)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                        injectionSite === site 
                          ? 'bg-[#4ADEA8]/20 text-[#4ADEA8] border border-[#4ADEA8]/50' 
                          : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
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
                <label className="block text-xs text-gray-400 mb-1">Pain Level (optional)</label>
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
                          : 'bg-white/5 text-gray-500 border border-transparent hover:bg-white/10'
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
              <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any observations..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-[#4ADEA8]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#4ADEA8]/50 resize-none"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="p-4 border-t border-[#4ADEA8]/20 space-y-2">
            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4ADEA8] to-[#6EE7B7] text-white font-semibold hover:shadow-lg hover:shadow-[#4ADEA8]/30 transition-all"
            >
              Log Injection
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {showDatePicker && (
        <DateWheelPickerModal
          isOpen={showDatePicker}
          value={date}
          onChange={(newDate) => {
            setDate(newDate);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </>
  );
};

export default LogPeptideModal;
