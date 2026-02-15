import React, { useState } from 'react';
import MedicationModal from './MedicationModal';

interface MedicationInputProps {
  onAddMedication: (dose: number, medication: string) => void;
}

const MedicationInput: React.FC<MedicationInputProps> = ({ onAddMedication }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddMedication = (dose: number, medication: string) => {
    onAddMedication(dose, medication);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:from-accent-purple-dark hover:to-accent-purple-medium transition-all duration-300 shadow-theme hover:shadow-theme-lg transform hover:scale-[1.02]"
      >
        Log Dose
      </button>
      
      <MedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddMedication={handleAddMedication}
      />
    </>
  );
};

export default MedicationInput;
