import React, { useState } from 'react';
import DoseModal from './DoseModal';

interface DoseInputProps {
  onAddDose: (dose: number, medication: string) => void;
}

const DoseInput: React.FC<DoseInputProps> = ({ onAddDose }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddDose = (dose: number, medication: string) => {
    onAddDose(dose, medication);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:from-accent-purple-dark hover:to-accent-purple-medium transition-all duration-300 shadow-theme hover:shadow-theme-lg transform hover:scale-[1.02]"
      >
        Log Dose
      </button>
      
      <DoseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddDose={handleAddDose}
      />
    </>
  );
};

export default DoseInput;
