import React, { useState, useEffect } from 'react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledged: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose, onAcknowledged }) => {
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAcknowledged(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinue = () => {
    localStorage.setItem('glpal_disclaimer_acknowledged', 'true');
    onAcknowledged();
  };

  return (
    <div 
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div 
        className="fixed inset-0 bg-black/60" 
        style={{ backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }} 
        onClick={() => { onClose(); setAcknowledged(false); }} 
      />
      <div 
        className="relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-[#B19CD9]/30 w-full max-w-sm p-6"
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        <h2 className="text-xl font-semibold text-white mb-4">Disclaimer</h2>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">
          This app is for informational and tracking purposes only. Medication schedules shown are based on publicly available prescribing information and are not medical advice.
        </p>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          By continuing, you confirm that the selected schedule was prescribed by your licensed healthcare provider. This app does not prescribe, recommend, or adjust medication doses. Always consult your healthcare provider before starting, stopping, or changing any medication.
        </p>
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="peer w-5 h-5 appearance-none rounded border border-[#B19CD9]/50 bg-black/30 checked:bg-[#B19CD9] checked:border-[#B19CD9] cursor-pointer transition-all"
            />
            <svg
              className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm text-[#4ADEA8]">I understand and agree to the above</span>
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => { onClose(); setAcknowledged(false); }}
            className="flex-1 py-3 rounded-xl border border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!acknowledged}
            className={`flex-1 py-3 rounded-xl bg-gradient-to-r font-medium transition-all ${
              acknowledged
                ? 'from-[#B19CD9] to-[#9C7BD3] text-white hover:shadow-[0_0_20px_rgba(177,156,217,0.5)]'
                : 'from-[#B19CD9]/50 to-[#9C7BD3]/50 text-white/50 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
