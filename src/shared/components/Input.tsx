import React from 'react';
import { useThemeStyles } from '../../contexts/ThemeContext';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'accent' | 'mint';
}

const Input: React.FC<InputProps> = ({ 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const { input } = useThemeStyles();
  
  const variantClasses = {
    default: "focus:ring-accent-purple-medium focus:border-accent-purple-medium",
    accent: "focus:ring-accent-purple-medium focus:border-accent-purple-medium", 
    mint: "focus:ring-accent-mint focus:border-accent-mint"
  };

  return (
    <input 
      className={`${input} ${variantClasses[variant]} ${className}`}
      {...props} 
    />
  );
};

export default Input;