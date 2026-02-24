import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  medicationName: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, medicationName, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div 
        className="fixed inset-0 bg-black/60" 
        style={{ backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }} 
        onClick={onClose} 
      />
      <div 
        className="relative bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 rounded-2xl shadow-2xl border border-red-500/30 w-full max-w-sm p-6"
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        <h2 className="text-xl font-semibold text-white mb-2">Delete {medicationName}?</h2>
        <p className="text-sm text-text-muted mb-6">This will remove all protocols for this medication. This action cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#B19CD9]/40 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500/80 text-white font-medium hover:bg-red-500 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
