import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({ 
  padding = 'md', 
  className = '', 
  children,
  ...props 
}) => {
  const baseClasses = "bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] border border-[#9C7BD3]/20";
  
  const paddingClasses = {
    sm: "p-3",
    md: "p-4", 
    lg: "p-6"
  };

  return (
    <div 
      className={`${baseClasses} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;