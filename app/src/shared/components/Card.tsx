import React, { memo } from 'react';
import { useThemeStyles } from '../../contexts/ThemeContext';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({ 
  padding = 'md', 
  className = '', 
  children,
  ...props 
}) => {
  const { card } = useThemeStyles();
  
  const paddingClasses = {
    sm: "p-3",
    md: "p-4", 
    lg: "p-6"
  };

  return (
    <div 
      className={`${card} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default memo(Card);