import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// =============================================================================
// THEME CONTEXT
// =============================================================================
// Provides theme state (dark/light mode) AND all theme-aware CSS classes
// - isDarkMode: boolean for current theme
// - theme: 'light' | 'dark' string
// - toggleTheme: function to switch themes
// - All style hooks: bigCard, button, input, modal, etc.

interface ThemeContextType {
  isDarkMode: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * - Initializes from localStorage or system preference
 * - Persists selection to localStorage
 * - Adds/removes 'dark' class on document root
 */
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

/**
 * Hook to access theme context AND all theme-aware styles
 * @throws Error if used outside ThemeProvider
 * 
 * @example
 * const { isDarkMode, bigCard, button, input, modal } = useTheme();
 * 
 * // For function styles (buttons with states):
 * const { button, segmentButton } = useTheme();
 * <button className={button(isActive)}>Click</button>
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  const { isDarkMode } = context;
  
  // Return context + all styles merged together
  return {
    ...context,
    
    // ==========================================================================
    // CARDS
    // ==========================================================================
    
    bigCard: isDarkMode 
      ? "bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl shadow-theme p-4 border border-[var(--card-border)] mt-3 mb-3"
      : "bg-white/90 backdrop-blur-lg rounded-2xl shadow-sm p-4 border border-gray-200 mt-3 mb-3",

    smallCard: isDarkMode 
      ? "min-h-16 sm:min-h-20 bg-[var(--card-bg)] backdrop-blur-sm p-2 rounded-xl border border-[var(--card-border)] flex flex-col justify-between"
      : "min-h-16 sm:min-h-20 bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between",

    card: isDarkMode
      ? "bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl border border-[var(--card-border)]"
      : "bg-white/90 backdrop-blur-lg rounded-2xl border border-gray-200 shadow-sm",

    tdeeCard: isDarkMode
      ? "flex justify-between items-center p-3 bg-[var(--card-bg)] backdrop-blur-sm rounded-xl border border-[var(--card-border)]"
      : "flex justify-between items-center p-3 bg-white backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm",


    // ==========================================================================
    // CARD TEXT STYLES
    // ==========================================================================

    bigCardText: {
      title: "text-lg font-medium text-text-primary mb-3",
      h1: isDarkMode 
        ? "text-2xl font-bold text-[var(--accent-purple-light)] mb-4 [text-shadow:0_0_20px_rgba(177,156,217,0.6)]"
        : "text-2xl font-bold text-[#9C7BD3] mb-4",
      h2: "text-lg font-semibold text-text-primary mb-3",
    },

    text: {
      label: isDarkMode 
        ? "text-xs text-[var(--accent-purple-light)] font-medium"
        : "text-xs text-gray-600 font-medium",
      value: isDarkMode
        ? "text-lg font-bold text-white [text-shadow:0_0_3px_rgba(255,255,255,0.3)]"
        : "text-lg font-bold text-gray-900",
      totalLossValue: isDarkMode
        ? "text-base font-bold text-white leading-tight inline-block"
        : "text-base font-bold text-gray-900 leading-tight inline-block",
      percentage: isDarkMode
        ? "text-[length:clamp(0.5rem,2.5cqw,0.75rem)] text-[var(--text-secondary)]/60 inline-block"
        : "text-[length:clamp(0.5rem,2.5cqw,0.75rem)] text-gray-500 inline-block",
      bmiCategory: "text-xs font-medium -mt-1 inline-block"
    },

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


    // ==========================================================================
    // BUTTONS
    // ==========================================================================

    button: (isActive: boolean = false) => {
      if (isActive) {
        return "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-[#0a0a0f] font-semibold shadow-[0_0_15px_rgba(74,222,168,0.4)]";
      }
      return isDarkMode
        ? "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]"
        : "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-white text-gray-700 border border-gray-300 hover:bg-gray-100";
    },

    primaryButton: isDarkMode
      ? "bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-medium py-2 px-4 rounded-lg hover:shadow-[0_0_15px_rgba(177,156,217,0.4)] transition-all"
      : "bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-medium py-2 px-4 rounded-lg hover:shadow-[0_0_15px_rgba(177,156,217,0.4)] transition-all",

    saveButton: "flex-1 bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:shadow-theme transition-all text-sm",

    cancelButton: (isDark: boolean) => `flex-1 px-4 py-2 rounded-lg border transition-all text-sm ${isDark ? 'border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`,

    deleteButton: (isDark: boolean) => `flex-1 px-4 py-2 rounded-lg border transition-all text-sm ${isDark ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-500 text-white hover:bg-red-600'}`,

    secondaryButton: (isActive: boolean = false) => {
      if (isActive) {
        return "py-2 px-2 rounded-full text-xs font-medium whitespace-nowrap transition-all bg-[#B19CD9] text-white";
      }
      return isDarkMode
        ? "py-2 px-2 rounded-full text-xs font-medium whitespace-nowrap transition-all bg-[#B19CD9]/5 text-[#B19CD9] border border-[#9C7BD3]/20 hover:bg-[#B19CD9]/10 hover:border-[#9C7BD3]/40"
        : "py-2 px-2 rounded-full text-xs font-medium whitespace-nowrap transition-all bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200";
    },

    segmentButton: (isActive: boolean = false) => {
      if (isActive) {
        return "flex-1 py-2 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]";
      }
      return isDarkMode
        ? "flex-1 py-2 rounded-lg text-sm font-medium transition-all bg-[#B19CD9]/5 text-[#B19CD9] border border-[#9C7BD3]/20 hover:bg-[#B19CD9]/10 hover:border-[#9C7BD3]/40"
        : "flex-1 py-2 rounded-lg text-sm font-medium transition-all bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200";
    },

    pillButton: (isActive: boolean = false, activeColor?: string): React.CSSProperties => {
      const color = activeColor || '#B19CD9';
      if (isActive) {
        return {
          backgroundColor: color,
          color: 'white',
          boxShadow: `0 0 10px ${color}60`,
        };
      }
      return isDarkMode
        ? {
            backgroundColor: 'rgba(26, 26, 36, 0.6)',
            color: '#9CA3AF',
            border: '1px solid rgba(177, 156, 217, 0.2)',
          }
        : {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            color: '#6B7280',
            border: '1px solid rgba(0, 0, 0, 0.1)',
          };
    },

    smallPillButton: (isActive: boolean = false, activeColor?: string): { className: string; style: React.CSSProperties } => {
      const color = activeColor || '#B19CD9';
      const baseClass = "flex-1 py-2 px-2 rounded-lg text-xs lg:py-1 lg:px-1.5 lg:text-[10px] font-medium whitespace-nowrap transition-colors duration-200";
      
      if (isActive) {
        return {
          className: baseClass,
          style: {
            backgroundColor: color,
            color: 'white',
            boxShadow: `0 0 10px ${color}60`,
          },
        };
      }
      return {
        className: baseClass,
        style: isDarkMode
          ? {
              backgroundColor: 'rgba(26, 26, 36, 0.6)',
              color: '#9CA3AF',
              border: '1px solid rgba(177, 156, 217, 0.2)',
            }
          : {
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              color: '#6B7280',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            },
      };
    },

    segmentedControl: (isActive: boolean = false) => {
      if (isActive) {
        return "flex-1 px-2 py-2 text-sm rounded-lg transition-all duration-300 bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]";
      }
      return isDarkMode
        ? "flex-1 px-2 py-2 text-sm rounded-lg transition-all duration-300 bg-[#B19CD9]/5 text-[#B19CD9] border border-[#9C7BD3]/20 hover:bg-[#B19CD9]/10 hover:border-[#9C7BD3]/40"
        : "flex-1 px-2 py-2 text-sm rounded-lg transition-all duration-300 bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200";
    },


    // ==========================================================================
    // FORM INPUTS
    // ==========================================================================

    input: isDarkMode
      ? "w-full px-3 py-2 border border-[var(--card-border)] bg-black/20 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-text-muted"
      : "w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-gray-400",

    inputButton: isDarkMode
      ? "w-full px-3 py-2 border border-[var(--card-border)] bg-black/20 text-text-secondary rounded-lg text-sm text-left"
      : "w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm text-left",

    textarea: isDarkMode
      ? "w-full px-3 py-2 border border-[var(--card-border)] bg-black/20 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-text-muted resize-none"
      : "w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-gray-400 resize-none",


    // ==========================================================================
    // MODALS
    // ==========================================================================

    modal: isDarkMode
      ? "bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl border border-[var(--card-border)] shadow-2xl"
      : "bg-white backdrop-blur-lg rounded-2xl border border-gray-200 shadow-2xl",

    modalContainer: "w-full max-w-sm sm:max-w-md lg:max-w-2xl p-4 sm:p-6 overflow-y-auto max-h-[90vh]",

    modalSmall: "w-full max-w-xs p-6",

    modalBackdrop: (isClosing: boolean = false) => 
      `fixed inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/40'} ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`,

    modalText: {
      title: isDarkMode ? "text-white" : "text-gray-900",
      label: isDarkMode ? "text-white" : "text-gray-800",
      value: isDarkMode ? "text-text-secondary" : "text-gray-600",
      subtitle: isDarkMode ? "text-text-secondary" : "text-gray-600",
      muted: isDarkMode ? "text-text-muted" : "text-gray-600",
    },

    // Modal label - consistent across all modals
    modalLabel: "block text-sm font-medium mb-2",
  };
};

// =============================================================================
// REUSABLE COMPONENTS
// =============================================================================

interface CollapseProps {
  isOpen: boolean;
  children: React.ReactNode;
}

export const Collapse: React.FC<CollapseProps> = ({ isOpen, children }) => {
  return (
    <div className={`collapse-content ${isOpen ? 'expanded' : 'collapsed'}`}>
      <div className="collapse-inner">
        {children}
      </div>
    </div>
  );
};

// Keep useThemeStyles as alias for backward compatibility
export const useThemeStyles = useTheme;
