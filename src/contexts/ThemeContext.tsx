import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// =============================================================================
// THEME CONTEXT
// =============================================================================
// Provides theme state (dark/light mode) to the entire application
// - isDarkMode: boolean for current theme
// - theme: 'light' | 'dark' string
// - toggleTheme: function to switch themes

interface ThemeContextType {
  isDarkMode: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
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

// =============================================================================
// THEME STYLES HOOK
// =============================================================================
// Provides all theme-aware CSS classes for components
// Each style is either a string or a function (for states like active/inactive)
// All styles automatically adapt to light/dark mode

export const useThemeStyles = () => {
  const { isDarkMode } = useTheme();
  
  return {
    // ==========================================================================
    // CARDS
    // ==========================================================================
    
    /**
     * Large card container with glassmorphism effect
     * Used for: Dashboard cards, feature sections
     * Example: <div className={bigCard}>...</div>
     */
    bigCard: isDarkMode 
      ? "bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl shadow-theme p-4 border border-[var(--card-border)] mt-3 mb-3"
      : "bg-white/90 backdrop-blur-lg rounded-2xl shadow-sm p-4 border border-gray-200 mt-3 mb-3",

    /**
     * Small metric card (single statistic)
     * Used for: Dashboard metric displays (weight, units, etc.)
     */
    smallCard: isDarkMode 
      ? "min-h-16 sm:min-h-20 bg-[var(--card-bg)] backdrop-blur-sm p-2 rounded-xl border border-[var(--card-border)] flex flex-col justify-between"
      : "min-h-16 sm:min-h-20 bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between",

    /**
     * Generic card container
     * Used for: Any card that needs consistent styling
     */
    card: isDarkMode
      ? "bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl border border-[var(--card-border)]"
      : "bg-white/90 backdrop-blur-lg rounded-2xl border border-gray-200 shadow-sm",

    /**
     * Long rectangular card for TDEE display
     */
    tdeeCard: isDarkMode
      ? "flex justify-between items-center p-3 bg-[var(--card-bg)] backdrop-blur-sm rounded-xl border border-[var(--card-border)]"
      : "flex justify-between items-center p-3 bg-white backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm",


    // ==========================================================================
    // CARD TEXT STYLES
    // ==========================================================================

    /**
     * Big card titles (h1, h2)
     * bigCardText.title - Card section titles
     * bigCardText.h1 - Main page headers (dark mode has purple glow)
     * bigCardText.h2 - Section headers
     */
    bigCardText: {
      title: "text-lg font-medium text-text-primary mb-3",
      h1: isDarkMode 
        ? "text-2xl font-bold text-[var(--accent-purple-light)] mb-4 [text-shadow:0_0_20px_rgba(177,156,217,0.6)]"
        : "text-2xl font-bold text-[#9C7BD3] mb-4",
      h2: "text-lg font-semibold text-text-primary mb-3",
    },

    /**
     * Text styles for small cards and metrics
     * text.label - Metric labels (e.g., "Weight", "Units")
     * text.value - Metric values (large numbers)
     * text.totalLossValue - Special styling for total loss
     * text.percentage - Percentage values
     * text.bmiCategory - BMI category labels
     */
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

    /**
     * TDEE card text styles
     */
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

    /**
     * Toggle button with active state
     * Used for: Simple on/off toggles
     * @param isActive - Whether button is in active state
     * Example: <button className={button(isActive)}>...</button>
     */
    button: (isActive: boolean = false) => {
      if (isActive) {
        return "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-[#0a0a0f] font-semibold shadow-[0_0_15px_rgba(74,222,168,0.4)]";
      }
      return isDarkMode
        ? "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]"
        : "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-white text-gray-700 border border-gray-300 hover:bg-gray-100";
    },

    /**
     * Primary action buttons (Save, Create, Calculate, Add)
     * Used for: Main form submission buttons
     * Example: <button className={primaryButton}>Save</button>
     */
    primaryButton: isDarkMode
      ? "bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-medium py-2 px-4 rounded-lg hover:shadow-[0_0_15px_rgba(177,156,217,0.4)] transition-all"
      : "bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white font-medium py-2 px-4 rounded-lg hover:shadow-[0_0_15px_rgba(177,156,217,0.4)] transition-all",

    /**
     * Save/Add button - alias for primaryButton
     * Used for: Form save buttons (renamed from "Update" to "Save")
     */
    saveButton: "flex-1 bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white py-2 px-4 rounded-lg hover:shadow-theme transition-all text-sm",

    /**
     * Cancel button - secondary/destructive actions
     * Used for: Cancel, Close, Dismiss actions
     * @param isDark - Whether to apply dark mode styling
     * Example: <button className={cancelButton(isDarkMode)}>Cancel</button>
     */
    cancelButton: (isDark: boolean) => `flex-1 px-4 py-2 rounded-lg border transition-all text-sm ${isDark ? 'border-[#B19CD9]/30 text-white hover:bg-[#B19CD9]/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`,

    /**
     * Delete button - danger actions
     * Used for: Delete confirmation, destructive actions
     * @param isDark - Whether to apply dark mode styling
     */
    deleteButton: (isDark: boolean) => `flex-1 px-4 py-2 rounded-lg border transition-all text-sm ${isDark ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-500 text-white hover:bg-red-600'}`,

    /**
     * Secondary/pill-shaped buttons
     * Used for: Preset values (e.g., dose amounts like 40mg, 50mg)
     * @param isActive - Whether button is selected
     */
    secondaryButton: (isActive: boolean = false) => {
      if (isActive) {
        return "py-2 px-2 rounded-full text-xs font-medium whitespace-nowrap transition-all bg-[#B19CD9] text-white";
      }
      return isDarkMode
        ? "py-2 px-2 rounded-full text-xs font-medium whitespace-nowrap transition-all bg-[#B19CD9]/5 text-[#B19CD9] border border-[#9C7BD3]/20 hover:bg-[#B19CD9]/10 hover:border-[#9C7BD3]/40"
        : "py-2 px-2 rounded-full text-xs font-medium whitespace-nowrap transition-all bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200";
    },

    /**
     * Segment/toggle buttons (equal width)
     * Used for: Grouped options (gender, Yes/No, categories)
     * @param isActive - Whether segment is selected
     */
    segmentButton: (isActive: boolean = false) => {
      if (isActive) {
        return "flex-1 py-2 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]";
      }
      return isDarkMode
        ? "flex-1 py-2 rounded-lg text-sm font-medium transition-all bg-[#B19CD9]/5 text-[#B19CD9] border border-[#9C7BD3]/20 hover:bg-[#B19CD9]/10 hover:border-[#9C7BD3]/40"
        : "flex-1 py-2 rounded-lg text-sm font-medium transition-all bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200";
    },

    /**
     * Filter/pill buttons - returns React.CSSProperties
     * Used for: Category filter buttons
     * @param isActive - Whether filter is active
     * @param activeColor - Override the default purple color
     */
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

    /**
     * Small pill buttons for calculator presets
     * Returns both className and style
     * Used for: Calculator input presets
     * @param isActive - Whether preset is selected
     * @param activeColor - Override default color
     */
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

    /**
     * Segmented control buttons (full-width grid toggles)
     * Used for: Period selectors (week, month, year)
     * @param isActive - Whether segment is selected
     */
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

    /**
     * Standard text input field
     * Used for: Text, number, email inputs in forms
     * Sizing: w-full px-3 py-2 text-sm (consistent across all inputs)
     * Example: <input className={input} />
     */
    input: isDarkMode
      ? "w-full px-3 py-2 border border-[var(--card-border)] bg-black/20 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-text-muted"
      : "w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-gray-400",

    /**
     * Button-styled input (date pickers, dropdowns)
     * Used for: Date pickers, select triggers, dropdowns
     * Same sizing as input for consistency
     */
    inputButton: isDarkMode
      ? "w-full px-3 py-2 border border-[var(--card-border)] bg-black/20 text-text-secondary rounded-lg text-sm text-left"
      : "w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm text-left",

    /**
     * Textarea field for multi-line input
     * Used for: Notes, descriptions, long text
     * Same sizing as input for consistency
     */
    textarea: isDarkMode
      ? "w-full px-3 py-2 border border-[var(--card-border)] bg-black/20 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-text-muted resize-none"
      : "w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B19CD9]/50 placeholder-gray-400 resize-none",


    // ==========================================================================
    // MODALS
    // ==========================================================================

    /**
     * Modal background styling (glass effect)
     * Used for: All modal containers
     * Example: <div className={modal}>...</div>
     */
    modal: isDarkMode
      ? "bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl border border-[var(--card-border)] shadow-2xl"
      : "bg-white backdrop-blur-lg rounded-2xl border border-gray-200 shadow-2xl",

    /**
     * Standard modal container sizing
     * Used for: Add/Edit modals
     * Responsive: max-w-sm → max-w-md → max-w-2xl
     */
    modalContainer: "w-full max-w-sm sm:max-w-md lg:max-w-2xl p-4 sm:p-6 overflow-y-auto max-h-[90vh]",

    /**
     * Small modal container (confirmations)
     * Used for: Delete confirmations, alerts
     */
    modalSmall: "w-full max-w-xs p-6",

    /**
     * Modal backdrop overlay
     * Used for: Modal background dimming
     * @param isClosing - Whether modal is closing (for animation)
     */
    modalBackdrop: (isClosing: boolean = false) => 
      `fixed inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/40'} ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`,

    /**
     * Modal text styles
     * modalText.title - Modal headers (h2)
     * modalText.label - Form labels
     * modalText.value - Display values
     * modalText.subtitle - Secondary info
     * modalText.muted - Placeholders, hints
     */
    modalText: {
      title: isDarkMode ? "text-white" : "text-gray-900",
      label: isDarkMode ? "text-white" : "text-gray-800",
      value: isDarkMode ? "text-text-secondary" : "text-gray-600",
      subtitle: isDarkMode ? "text-text-secondary" : "text-gray-600",
      muted: isDarkMode ? "text-text-muted" : "text-gray-600",
    },

    // Expose isDarkMode for custom styling when needed
    isDarkMode
  };
};
