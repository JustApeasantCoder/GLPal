import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'mint';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  className = '', 
  children,
  ...props 
}) => {
  const baseClasses = "rounded-lg transition-all duration-300 transform hover:scale-[1.02]";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white shadow-theme hover:shadow-theme-lg hover:from-accent-purple-dark hover:to-accent-purple-medium",
    accent: "bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]",
    mint: "bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white shadow-[0_0_15px_rgba(74,222,168,0.4)]"
  };

  const sizeClasses = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-2", 
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;