import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const theme = isDarkMode ? 'dark' : 'light';

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme Style Constants
export const useThemeStyles = () => {
  const { isDarkMode } = useTheme();
  
  return {
    // Big Card (Light & Dark Mode)
    bigCard: isDarkMode 
      ? "bg-card-bg backdrop-blur-lg rounded-2xl shadow-theme p-4 border border-card-border mt-3 mb-3"
      : "bg-white/90 backdrop-blur-lg rounded-2xl shadow-sm p-4 border border-gray-200 mt-3 mb-3",
    
    // Small Card (Light & Dark Mode)
    smallCard: isDarkMode 
      ? "min-h-16 sm:min-h-20 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-2 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between"
      : "min-h-16 sm:min-h-20 bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between",
    
    // Big Card Text styles
    bigCardText: {
      title: "text-lg font-medium text-text-primary mb-3",
      h1: isDarkMode 
        ? "text-2xl font-bold text-[#B19CD9] mb-4 [text-shadow:0_0_20px_rgba(177,156,217,0.6)]"
        : "text-2xl font-bold text-[#9C7BD3] mb-4",
      h2: "text-lg font-semibold text-text-primary mb-3",
    },

    // Text styles for small cards
    text: {
      label: isDarkMode 
        ? "text-xs text-[#B19CD9] font-medium"
        : "text-xs text-gray-600 font-medium",
      value: isDarkMode
        ? "text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]"
        : "text-lg font-bold text-gray-900",
      // Special styling for Total Loss card (uses text-base and has nested span)
      totalLossValue: isDarkMode
        ? "text-base font-bold text-white leading-tight [text-shadow:0_0_3px_rgba(177,156,217,0.5)] inline-block"
        : "text-base font-bold text-gray-900 leading-tight inline-block",
      percentage: isDarkMode
        ? "text-[length:clamp(0.5rem,2.5cqw,0.75rem)] text-[#B19CD9]/80 inline-block"
        : "text-[length:clamp(0.5rem,2.5cqw,0.75rem)] text-gray-500 inline-block",
      bmiCategory: "text-xs font-medium -mt-1 inline-block"
    },
    
    
    // TDEE Cards (long rectangular with small card colors)
    tdeeCard: isDarkMode
      ? "flex justify-between items-center p-3 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)]"
      : "flex justify-between items-center p-3 bg-white backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm",
    
    tdeeText: {
      label: isDarkMode 
        ? "text-xs text-[#B19CD9] font-medium"
        : "text-xs text-gray-600 font-medium",
      value: isDarkMode
        ? "text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]"
        : "text-lg font-bold text-gray-900",
      subtitle: isDarkMode
        ? "text-sm text-[#B19CD9]/80 -mt-1 inline-block"
        : "text-sm text-gray-500 -mt-1 inline-block"
    },
    
    // Button styles with active state
    button: (isActive: boolean = false) => {
      if (isActive) {
        return "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]";
      }
      
      return isDarkMode
        ? "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]"
        : "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-white text-gray-700 border border-gray-300 hover:bg-gray-100";
    },

    // Input styles
    input: isDarkMode
      ? "w-full px-3 py-2 border border-[#B19CD9]/30 bg-black/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-text-muted"
      : "w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-gray-400",

    // Card base for generic use
    card: isDarkMode
      ? "bg-black/30 backdrop-blur-lg rounded-2xl border border-[#9C7BD3]/20"
      : "bg-white/90 backdrop-blur-lg rounded-2xl border border-gray-200 shadow-sm",

    // Include isDarkMode for future use
    isDarkMode
  };
};
