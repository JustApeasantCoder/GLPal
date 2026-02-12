import React, { useState } from 'react';

interface BMIInfoTooltipProps {
  className?: string;
}

const BMIInfoTooltip: React.FC<BMIInfoTooltipProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const bmiCategories = [
    { abbreviation: 'UW', description: 'Underweight', range: 'BMI < 18.5' },
    { abbreviation: 'NW', description: 'Normal Weight', range: 'BMI 18.5-24.9' },
    { abbreviation: 'OW', description: 'Overweight', range: 'BMI 25-29.9' },
    { abbreviation: 'OB I', description: 'Obesity Class I', range: 'BMI 30-34.9' },
    { abbreviation: 'OB II', description: 'Obesity Class II', range: 'BMI 35-39.9' },
    { abbreviation: 'OB III', description: 'Obesity Class III', range: 'BMI ≥ 40' },
  ];

  return (
    <div className={`relative inline-block ${className}`}>
      <button
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

      {isVisible && (
        <div className="absolute z-50 w-64 p-3 bg-black/90 backdrop-blur-lg rounded-lg shadow-xl border border-[#9C7BD3]/20 -top-2 right-0 translate-x-full ml-2">
          <div className="text-white text-sm space-y-2">
            <h4 className="font-semibold text-[#4ADEA8] mb-2">BMI Categories</h4>
            {bmiCategories.map((category) => (
              <div key={category.abbreviation} className="flex justify-between items-center">
                <span className="font-medium">{category.abbreviation}:</span>
                <div className="text-right">
                  <div className="text-xs text-gray-300">{category.description}</div>
                  <div className="text-xs text-gray-400">{category.range}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BMIInfoTooltip;