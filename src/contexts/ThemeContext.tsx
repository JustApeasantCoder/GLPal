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
      : "bg-card-bg backdrop-blur-lg rounded-2xl shadow-theme p-4 border border-card-border mt-3 mb-3",
    
    // Small Card (Light & Dark Mode)
    smallCard: isDarkMode 
      ? "min-h-16 sm:h-18 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm p-2 rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between"
      : "min-h-16 sm:h-18 bg-white/80 dark:from-[#B19CD9]/20 dark:to-[#9C7BD3]/20 dark:bg-gradient-to-br backdrop-blur-sm p-2 rounded-xl border border-gray-200 dark:border-[#B19CD9]/30 shadow-sm dark:shadow-[0_0_5px_rgba(177,156,217,0.3)] flex flex-col justify-between",
    
    // Big Card Text styles
    bigCardText: {
      title: "text-lg font-medium text-text-primary mb-3",
      h1: "text-2xl font-bold text-gray-900 dark:text-[#B19CD9] mb-4 dark:[text-shadow:0_0_20px_rgba(177,156,217,0.6)]",
      h2: "text-lg font-semibold text-text-primary mb-3",
    },

    // Text styles for small cards
    text: {
      label: isDarkMode 
        ? "text-xs text-[#B19CD9] font-medium"
        : "text-xs text-gray-600 dark:text-[#B19CD9] font-medium",
      value: isDarkMode
        ? "text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]"
        : "text-lg font-bold text-gray-900 dark:text-white dark:[text-shadow:0_0_3px_rgba(177,156,217,0.5)]",
      // Special styling for Total Loss card (uses text-base and has nested span)
      totalLossValue: isDarkMode
        ? "text-base font-bold text-white leading-tight [text-shadow:0_0_3px_rgba(177,156,217,0.5)] inline-block"
        : "text-base font-bold text-gray-900 leading-tight dark:text-white dark:[text-shadow:0_0_3px_rgba(177,156,217,0.5)] inline-block",
      percentage: isDarkMode
        ? "text-[length:clamp(0.5rem,2cqw,0.75rem)] text-[#B19CD9]/80 inline-block"
        : "text-[length:clamp(0.5rem,2cqw,0.75rem)] text-gray-500 dark:text-[#B19CD9]/80 inline-block",
      bmiCategory: "text-xs font-medium -mt-1 inline-block"
    },
    
    
    // TDEE Cards (long rectangular with small card colors)
    tdeeCard: isDarkMode
      ? "flex justify-between items-center p-3 bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)]"
      : "flex justify-between items-center p-3 bg-white/80 dark:from-[#B19CD9]/20 dark:to-[#9C7BD3]/20 dark:bg-gradient-to-br backdrop-blur-sm rounded-xl border border-gray-200 dark:border-[#B19CD9]/30 shadow-sm dark:shadow-[0_0_5px_rgba(177,156,217,0.3)]",
    
    tdeeText: {
      label: isDarkMode 
        ? "text-s text-[#B19CD9] font-medium"
        : "text-s text-gray-600 dark:text-[#B19CD9] font-medium",
      value: isDarkMode
        ? "text-lg font-bold text-white [text-shadow:0_0_3px_rgba(177,156,217,0.5)]"
        : "text-lg font-bold text-gray-900 dark:text-white dark:[text-shadow:0_0_3px_rgba(177,156,217,0.5)]",
      subtitle: isDarkMode
        ? "text-sm text-[#B19CD9]/80 -mt-1 inline-block"
        : "text-sm text-gray-500 dark:text-[#B19CD9]/80 -mt-1 inline-block"
    },
    
    // Button styles with active state
    button: (isActive: boolean = false) => {
      if (isActive) {
        // Active button style (same for both themes as per your preference)
        return "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]";
      }
      
      // Normal button style - differs by theme
      return isDarkMode
        ? "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]"
        : "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-white/80 dark:bg-accent-purple-light/10 text-gray-700 dark:text-accent-purple-light border border-gray-200 dark:border-accent-purple-light/30 hover:bg-gray-100 dark:hover:bg-accent-purple-light/20 hover:shadow-card-md";
    },
    
    // Include isDarkMode for future use
    isDarkMode
  };
};