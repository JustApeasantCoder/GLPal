import React, { useState } from 'react';
import { isDevMode } from './debug';

interface DevPanelProps {
  title: string;
  colorScheme?: 'red' | 'green' | 'yellow' | 'cyan' | 'blue';
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const colorMap = {
  red: {
    border: 'border-red-500/30',
    bg: 'bg-black/40',
    title: 'text-red-400',
    section: 'text-red-300',
    line: 'border-red-500/20',
  },
  green: {
    border: 'border-green-500/30',
    bg: 'bg-black/40',
    title: 'text-green-400',
    section: 'text-green-300',
    line: 'border-green-500/20',
  },
  yellow: {
    border: 'border-yellow-500/30',
    bg: 'bg-black/40',
    title: 'text-yellow-400',
    section: 'text-yellow-300',
    line: 'border-yellow-500/20',
  },
  cyan: {
    border: 'border-cyan-500/30',
    bg: 'bg-black/40',
    title: 'text-cyan-400',
    section: 'text-cyan-300',
    line: 'border-cyan-500/20',
  },
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-black/40',
    title: 'text-blue-400',
    section: 'text-blue-300',
    line: 'border-blue-500/20',
  },
};

const DevPanel: React.FC<DevPanelProps> = ({ 
  title, 
  colorScheme = 'red', 
  defaultOpen = false, 
  children 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const colors = colorMap[colorScheme];

  if (!isDevMode) return null;

  return (
    <div className={`mb-4 p-3 rounded-lg ${colors.bg} border ${colors.border} text-xs font-mono max-h-96 overflow-y-auto`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left ${colors.title} font-bold mb-2 flex items-center gap-1`}
      >
        <span className={isOpen ? 'text-green-400' : 'text-gray-500'}>{isOpen ? '▼' : '▶'}</span>
        {title}
      </button>
      {isOpen && children}
    </div>
  );
};

export default DevPanel;

export const DevToggle: React.FC<{
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  colorScheme?: 'red' | 'green' | 'yellow' | 'cyan';
}> = ({ label, value, onChange, colorScheme = 'yellow' }) => {
  const colors = colorMap[colorScheme];
  
  if (!isDevMode) return null;

  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`text-xs ${colors.title} hover:underline mb-2`}
    >
      {value ? '▼ Hide' : '▶ Show'} {label}
    </button>
  );
};

export const DevTimeControls: React.FC<{
  onTravelDays: (days: number) => void;
  onReset: () => void;
}> = ({ onTravelDays, onReset }) => {
  if (!isDevMode) return null;

  return (
    <>
      <button
        onClick={() => onTravelDays(-2 / 60)}
        className="p-2 rounded-xl hover:bg-accent-purple-light/10 transition-all duration-300"
        aria-label="Go back 2 hours"
        title="-2 Hours"
      >
        <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <button
        onClick={() => onTravelDays(2 / 60)}
        className="p-2 rounded-xl hover:bg-accent-purple-light/10 transition-all duration-300"
        aria-label="Go forward 2 hours"
        title="+2 Hours"
      >
        <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <button
        onClick={() => onTravelDays(-1)}
        className="p-2 rounded-xl hover:bg-accent-purple-light/10 transition-all duration-300"
        aria-label="Go back 1 day"
        title="-1 Day"
      >
        <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      <button
        onClick={() => onTravelDays(1)}
        className="p-2 rounded-xl hover:bg-accent-purple-light/10 transition-all duration-300"
        aria-label="Speed up 1 day"
        title="+1 Day"
      >
        <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      <button
        onClick={onReset}
        className="p-2 rounded-xl hover:bg-accent-purple-light/10 transition-all duration-300"
        aria-label="Reset dose simulation"
        title="Reset"
      >
        <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </>
  );
};

export const DevInfoBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isDevMode) return null;
  
  return (
    <div className="text-xs text-text-secondary font-mono bg-black/20 px-2 py-1 rounded">
      {children}
    </div>
  );
};
