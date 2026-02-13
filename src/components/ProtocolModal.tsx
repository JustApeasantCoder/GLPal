import React, { useState, useEffect } from 'react';
import { GLP1Protocol } from '../types';
import { MEDICATIONS, generateId } from '../constants/medications';

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (protocol: GLP1Protocol) => void;
  onArchive?: (protocol: GLP1Protocol) => void;
  onDelete?: (id: string) => void;
  protocol?: GLP1Protocol | null;
  mode: 'add' | 'edit';
}

const ProtocolModal: React.FC<ProtocolModalProps> = ({ isOpen, onClose, onSave, onArchive, onDelete, protocol, mode }) => {
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [dose, setDose] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('1');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [stopDate, setStopDate] = useState<string>('');
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfirmAction(null);
      if (mode === 'edit' && protocol) {
        setSelectedMedication(protocol.medication);
        setDose(protocol.dose.toString());
        setFrequency(protocol.frequencyPerWeek.toString());
        setStartDate(protocol.startDate);
        setStopDate(protocol.stopDate || '');
      } else {
        setSelectedMedication('');
        setDose('');
        setFrequency('1');
        setStartDate(new Date().toISOString().split('T')[0]);
        setStopDate('');
      }
    }
  }, [isOpen, mode, protocol]);

  const handleSave = () => {
    const med = MEDICATIONS.find(m => m.id === selectedMedication);
    if (!med || !dose || !frequency || !startDate) return;

    const stopDateValue = stopDate 
      ? stopDate 
      : new Date(new Date(startDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newProtocol: GLP1Protocol = {
      id: protocol?.id || generateId(),
      medication: selectedMedication,
      dose: parseFloat(dose),
      frequencyPerWeek: parseInt(frequency),
      startDate,
      stopDate: stopDateValue,
      halfLifeHours: med.halfLifeHours,
    };

    onSave(newProtocol);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card-bg backdrop-blur-xl rounded-2xl shadow-theme-lg border border-card-border w-full max-w-sm p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {mode === 'add' ? 'Add Protocol' : 'Edit Protocol'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#B19CD9] mb-2">Medication</label>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {MEDICATIONS.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => {
                    setSelectedMedication(med.id);
                    setDose(med.defaultDose.toString());
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm text-white ${
                    selectedMedication === med.id
                      ? 'bg-[#B19CD9]/30 border border-[#B19CD9]'
                      : 'bg-black/20 border border-transparent hover:bg-[#B19CD9]/10'
                  }`}
                >
                  {med.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#B19CD9] mb-2">Dose (mg)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="99.9"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Enter dose"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B19CD9] mb-2">Dosing Schedule</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm"
              >
                <option value="7">Everyday</option>
                <option value="3.5">Every 2 Days</option>
                <option value="2.333">Every 3 Days</option>
                <option value="2">Every 3.5 Days</option>
                <option value="1.75">Every 4 Days</option>
                <option value="1.4">Every 5 Days</option>
                <option value="1.167">Every 6 Days</option>
                <option value="1">Every Week</option>
                <option value="0.5">Every 2 Weeks</option>
                <option value="0.333">Every 3 Weeks</option>
                <option value="0.233">Every Month</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#B19CD9] mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm"
              style={{ colorScheme: 'dark' }}
            />
            <div className="flex gap-2 mt-2">
              {[
                { label: '1W', days: 7 },
                { label: '2W', days: 14 },
                { label: '1M', days: 30 },
                { label: '1Y', days: 365 },
              ].map((preset) => {
                const isSelected = startDate && stopDate && stopDate === new Date(new Date(startDate).getTime() + preset.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    if (startDate) {
                      const endDate = new Date(new Date(startDate).getTime() + preset.days * 24 * 60 * 60 * 1000);
                      setStopDate(endDate.toISOString().split('T')[0]);
                    }
                  }}
                  className={`flex-1 px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                      : 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]'
                  }`}
                >
                  {preset.label}
                </button>
              )})}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#B19CD9] mb-2">End Date (optional)</label>
            <input
              type="date"
              value={stopDate}
              onChange={(e) => setStopDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg text-sm"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="flex gap-2">
            {mode === 'edit' && onDelete && onArchive && !confirmAction && (
              <>
                <button
                  onClick={() => setConfirmAction('archive')}
                  className="flex-1 px-4 py-2 rounded-lg border border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10 transition-all text-sm"
                >
                  Archive
                </button>
                <button
                  onClick={() => setConfirmAction('delete')}
                  className="flex-1 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm"
                >
                  Delete
                </button>
              </>
            )}
            {mode === 'edit' && confirmAction && (
              <>
                <button
                  onClick={() => {
                    if (protocol && confirmAction === 'archive' && onArchive) {
                      onArchive(protocol);
                    }
                    if (protocol && confirmAction === 'delete' && onDelete) {
                      onDelete(protocol.id);
                    }
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm"
                >
                  Yes, {confirmAction}
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10 transition-all text-sm"
                >
                  Cancel
                </button>
              </>
            )}
            {mode === 'add' && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10 transition-all text-sm"
              >
                Cancel
              </button>
            )}
            {!confirmAction && (
              <button
                onClick={handleSave}
                className={`${mode === 'edit' ? 'flex-1' : 'flex-1'} bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:shadow-theme transition-all text-sm`}
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolModal;
