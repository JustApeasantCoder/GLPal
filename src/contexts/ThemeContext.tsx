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
      ? "bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl shadow-theme p-4 border border-[var(--card-border)] mt-3 mb-3"
      : "bg-white/90 backdrop-blur-lg rounded-2xl shadow-sm p-4 border border-gray-200 mt-3 mb-3",
    
    // Small Card (Light & Dark Mode)
    smallCard: isDarkMode 
      ? "min-h-16 sm:min-h-20 bg-[var(--card-bg)] backdrop-blur-sm p-2 rounded-xl border border-[var(--card-border)] flex flex-col justify-between"
      : "min-h-16 sm:min-h-20 bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between",
    
    // Big Card Text styles
    bigCardText: {
      title: "text-lg font-medium text-text-primary mb-3",
      h1: isDarkMode 
        ? "text-2xl font-bold text-[var(--accent-purple-light)] mb-4 [text-shadow:0_0_20px_rgba(177,156,217,0.6)]"
        : "text-2xl font-bold text-[#9C7BD3] mb-4",
      h2: "text-lg font-semibold text-text-primary mb-3",
    },

    // Text styles for small cards
    text: {
      label: isDarkMode 
        ? "text-xs text-[var(--accent-purple-light)] font-medium"
        : "text-xs text-gray-600 font-medium",
      value: isDarkMode
        ? "text-lg font-bold text-white [text-shadow:0_0_3px_rgba(255,255,255,0.3)]"
        : "text-lg font-bold text-gray-900",
      // Special styling for Total Loss card (uses text-base and has nested span)
      totalLossValue: isDarkMode
        ? "text-base font-bold text-white leading-tight inline-block"
        : "text-base font-bold text-gray-900 leading-tight inline-block",
      percentage: isDarkMode
        ? "text-[length:clamp(0.5rem,2.5cqw,0.75rem)] text-[var(--text-secondary)]/60 inline-block"
        : "text-[length:clamp(0.5rem,2.5cqw,0.75rem)] text-gray-500 inline-block",
      bmiCategory: "text-xs font-medium -mt-1 inline-block"
    },
    
    
    // TDEE Cards (long rectangular with small card colors)
    tdeeCard: isDarkMode
      ? "flex justify-between items-center p-3 bg-[var(--card-bg)] backdrop-blur-sm rounded-xl border border-[var(--card-border)]"
      : "flex justify-between items-center p-3 bg-white backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm",
    
    tdeeText: {
      label: isDarkMode 
        ? "text-xs text-[var(--accent-purple-light)] font-medium"
        : "text-xs text-gray-600 font-medium",
      value: isDarkMode
        ? "text-lg font-bold text-white [text-shadow:0_0_3px_rgba(255,255,255,0.3)]"
        : "text-lg font-bold text-gray-900",
      subtitle: isDarkMode
        ? "text-sm text-white/60 -mt-1 inline-block"
        : "text-sm text-gray-500 -mt-1 inline-block"
    },
    
    // Button styles with active state
    button: (isActive: boolean = false) => {
      if (isActive) {
        return "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-[#0a0a0f] font-semibold shadow-[0_0_15px_rgba(74,222,168,0.4)]";
      }
      
      return isDarkMode
        ? "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]"
        : "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-white text-gray-700 border border-gray-300 hover:bg-gray-100";
    },

    // ==================== Buttons ====================
    // Primary action buttons (Save, Create, Calculate, Add)
    primaryButton: isDarkMode
      ? "bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-medium py-2 px-4 rounded-lg hover:shadow-[0_0_15px_rgba(177,156,217,0.4)] transition-all"
      : "bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-medium py-2 px-4 rounded-lg hover:shadow-[0_0_15px_rgba(177,156,217,0.4)] transition-all",

    // Secondary/small buttons (pill-shaped presets like 40mg, 50mg)
    secondaryButton: (isActive: boolean = false) => {
      if (isActive) {
        return "py-2 px-2 rounded-full text-xs font-medium whitespace-nowrap transition-all bg-[#B19CD9] text-white";
      }
      return isDarkMode
        ? "py-2 px-2 rounded-full text-xs font-medium whitespace-nowrap transition-all bg-[#B19CD9]/5 text-[#B19CD9] border border-[#9C7BD3]/20 hover:bg-[#B19CD9]/10 hover:border-[#9C7BD3]/40"
        : "py-2 px-2 rounded-full text-xs font-medium whitespace-nowrap transition-all bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200";
    },

    // Segment/toggle buttons (gender, Yes/No)
    segmentButton: (isActive: boolean = false) => {
      if (isActive) {
        return "flex-1 py-2 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]";
      }
      return isDarkMode
        ? "flex-1 py-2 rounded-lg text-sm font-medium transition-all bg-[#B19CD9]/5 text-[#B19CD9] border border-[#9C7BD3]/20 hover:bg-[#B19CD9]/10 hover:border-[#9C7BD3]/40"
        : "flex-1 py-2 rounded-lg text-sm font-medium transition-all bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200";
    },

    // Segmented control buttons (PeriodSelector - full-width grid toggles)
    segmentedControl: (isActive: boolean = false) => {
      if (isActive) {
        return "flex-1 px-2 py-2 text-sm rounded-lg transition-all duration-300 bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]";
      }
      return isDarkMode
        ? "flex-1 px-2 py-2 text-sm rounded-lg transition-all duration-300 bg-[#B19CD9]/5 text-[#B19CD9] border border-[#9C7BD3]/20 hover:bg-[#B19CD9]/10 hover:border-[#9C7BD3]/40"
        : "flex-1 px-2 py-2 text-sm rounded-lg transition-all duration-300 bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200";
    },

    // ==================== Form Inputs ====================
    // <textarea> fields
    textarea: isDarkMode
      ? "w-full px-3 py-2 border border-[var(--card-border)] bg-black/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-text-muted resize-none"
      : "w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-gray-400 resize-none",

    // Buttons that look like inputs (date pickers, dropdown selects)
    inputButton: isDarkMode
      ? "w-full px-3 py-2 border border-[var(--card-border)] bg-black/20 text-white rounded-lg text-sm text-left"
      : "w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm text-left",

    // ==================== Form Inputs ====================
    // Input styles
    input: isDarkMode
      ? "w-full px-3 py-2 border border-[var(--card-border)] bg-black/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-text-muted"
      : "w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-gray-400",

    // Card base for generic use
    card: isDarkMode
      ? "bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl border border-[var(--card-border)]"
      : "bg-white/90 backdrop-blur-lg rounded-2xl border border-gray-200 shadow-sm",

    // Modal styles - Big Card style with glass effect
    modal: isDarkMode
      ? "bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl border border-[var(--card-border)]"
      : "bg-white backdrop-blur-lg rounded-2xl border border-gray-200",

    // Modal text styles - unified text colors for all modals
    modalText: {
      // Modal titles (h2) - bold headers
      title: isDarkMode ? "text-white" : "text-gray-900",
      
      // Form labels - like "Medication", "Date", "Dose"
      label: isDarkMode ? "text-text-secondary" : "text-gray-700",
      
      // Display values - like medication name, selected values
      value: isDarkMode ? "text-text-primary" : "text-gray-900",
      
      // Subtitles/secondary info - like dates, descriptions  
      subtitle: isDarkMode ? "text-white/80" : "text-gray-600",
      
      // Muted/hint text - placeholders, hints
      muted: isDarkMode ? "text-text-muted" : "text-gray-500",
    },

    // Include isDarkMode for future use
    isDarkMode
  };
};
