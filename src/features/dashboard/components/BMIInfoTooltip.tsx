import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface BMIInfoTooltipProps {
  className?: string;
}

const BMIInfoTooltip: React.FC<BMIInfoTooltipProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const bmiCategories = [
    { abbreviation: 'UW', description: 'Underweight', range: 'BMI < 18.5' },
    { abbreviation: 'NW', description: 'Normal Weight', range: 'BMI 18.5-24.9' },
    { abbreviation: 'OW', description: 'Overweight', range: 'BMI 25-29.9' },
    { abbreviation: 'OB I', description: 'Obesity Class I', range: 'BMI 30-34.9' },
    { abbreviation: 'OB II', description: 'Obesity Class II', range: 'BMI 35-39.9' },
    { abbreviation: 'OB III', description: 'Obesity Class III', range: 'BMI ≥ 40' },
  ];

  useEffect(() => {
    if (isVisible && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height + 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [isVisible]);

  const tooltip = isVisible ? (
    <div 
      className="fixed z-[9999] w-32 p-2 bg-black/90 backdrop-blur-lg rounded-lg shadow-xl border border-[#9C7BD3]/20"
      style={{ 
        top: position.top, 
        left: position.left,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="text-white text-xs space-y-1">
        {bmiCategories.map((category) => (
          <div key={category.abbreviation} className="flex justify-between items-center text-[10px]">
            <span className="font-medium">{category.abbreviation}:</span>
            <div className="text-right">
              <div className="text-gray-300">{category.description}</div>
              <div className="text-gray-400">{category.range}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className={`relative inline-block ${className}`}>
        <button
          ref={buttonRef}
          className="text-[#9C7BD3] hover:text-[#B19CD9] transition-colors duration-200 cursor-help"
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          onClick={() => setIsVisible(!isVisible)}
          aria-label="BMI category information"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </button>
      </div>
      {createPortal(tooltip, document.body)}
    </>
  );
};

export default BMIInfoTooltip;
