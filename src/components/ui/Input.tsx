import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'accent' | 'mint';
}

const Input: React.FC<InputProps> = ({ 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const baseClasses = "w-full px-3 py-2 border border-accent-purple-light/30 bg-card-bg backdrop-blur-sm text-text-secondary rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 placeholder-text-muted";
  
  const variantClasses = {
    default: "focus:ring-accent-purple-medium focus:border-accent-purple-medium",
    accent: "focus:ring-accent-purple-medium focus:border-accent-purple-medium", 
    mint: "focus:ring-accent-mint focus:border-accent-mint"
  };

  return (
    <input 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props} 
    />
  );
};

export default Input;