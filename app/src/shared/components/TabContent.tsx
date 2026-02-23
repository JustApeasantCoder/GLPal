import React from 'react';

interface TabContentProps {
  children: React.ReactNode;
  isActive: boolean;
}

export const TabContent: React.FC<TabContentProps> = ({ children, isActive }) => {
  return (
    <div
      className={`transition-all duration-500 ease-in-out transform ${
        isActive
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-full absolute inset-0 pointer-events-none'
      }`}
    >
      {children}
    </div>
  );
};