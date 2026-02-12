import { useTheme } from '../contexts/ThemeContext';

// Base style constants (shared between themes)
const BASE_STYLES = {
  bigCard: "bg-card-bg backdrop-blur-lg rounded-2xl shadow-theme p-4 border border-card-border",
  
  // Text shadows - Consistent across components
  textShadow: {
    light: '0 0 20px rgba(45,27,78,0.3)',
    dark: '0 0 20px rgba(177,156,217,0.5)',
    medium: '0 0 15px rgba(177,156,217,0.5)',
    small: '0 0 10px rgba(177,156,217,0.5)',
    accent: '0 0 3px rgba(177,156,217,0.5)'
  }
} as const;

// Theme-specific style generators
const createSmallCardStyles = (isDarkMode: boolean) => ({
  base: "h-16 sm:h-18 p-2 rounded-xl flex flex-col justify-between",
  background: isDarkMode 
    ? "bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm"
    : "bg-white/80 dark:from-[#B19CD9]/20 dark:to-[#9C7BD3]/20 dark:bg-gradient-to-br backdrop-blur-sm",
  border: isDarkMode 
    ? "border border-[#B19CD9]/30"
    : "border border-gray-200 dark:border-[#B19CD9]/30",
  shadow: isDarkMode 
    ? "shadow-[0_0_5px_rgba(177,156,217,0.3)]"
    : "shadow-sm dark:shadow-[0_0_5px_rgba(177,156,217,0.3)]"
});

const createTextStyles = (isDarkMode: boolean) => ({
  // Base text styles
  label: `text-xs font-medium ${isDarkMode ? 'text-[#B19CD9]' : 'text-gray-600 dark:text-[#B19CD9]'}`,
  
  // Value styles with text shadows
  value: `text-lg font-bold ${
    isDarkMode ? 'text-white' : 'text-gray-900 dark:text-white'
  } ${isDarkMode ? '[text-shadow:0_0_3px_rgba(177,156,217,0.5)]' : 'dark:[text-shadow:0_0_3px_rgba(177,156,217,0.5)]'}`,
  
  totalLossValue: `text-base font-bold ${
    isDarkMode ? 'text-white' : 'text-gray-900 dark:text-white'
  } leading-tight [text-shadow:0_0_3px_rgba(177,156,217,0.5)] inline-block`,
  
  percentage: `text-xs ${
    isDarkMode ? 'text-[#B19CD9]/80' : 'text-gray-500 dark:text-[#B19CD9]/80'
  } inline-block`,
  
  bmiCategory: "text-xs font-medium -mt-1 inline-block",
  
  // Card title styles
  title: "text-lg font-medium text-text-primary mb-3",
  h1: `text-2xl font-bold text-gray-900 dark:text-[#B19CD9] mb-4 dark:[text-shadow:0_0_20px_rgba(177,156,217,0.6)]`,
  h2: "text-lg font-semibold text-text-primary mb-3"
});

const createTDEEStyles = (isDarkMode: boolean) => ({
  card: `flex justify-between items-center p-3 ${
    isDarkMode 
      ? "bg-gradient-to-br from-[#B19CD9]/20 to-[#9C7BD3]/20 backdrop-blur-sm rounded-xl border border-[#B19CD9]/30 shadow-[0_0_5px_rgba(177,156,217,0.3)]"
      : "bg-white/80 dark:from-[#B19CD9]/20 dark:to-[#9C7BD3]/20 dark:bg-gradient-to-br backdrop-blur-sm rounded-xl border border-gray-200 dark:border-[#B19CD9]/30 shadow-sm dark:shadow-[0_0_5px_rgba(177,156,217,0.3)]"
  }`,
  
  text: {
    label: `text-s ${
      isDarkMode ? 'text-[#B19CD9]' : 'text-gray-600 dark:text-[#B19CD9]'
    } font-medium`,
    value: `text-lg font-bold ${
      isDarkMode ? 'text-white' : 'text-gray-900 dark:text-white'
    } ${isDarkMode ? '[text-shadow:0_0_3px_rgba(177,156,217,0.5)]' : 'dark:[text-shadow:0_0_3px_rgba(177,156,217,0.5)]'}`,
    subtitle: `text-sm ${
      isDarkMode ? 'text-[#B19CD9]/80' : 'text-gray-500 dark:text-[#B19CD9]/80'
    } -mt-1 inline-block`
  }
});

const createButtonStyles = (isDarkMode: boolean) => ({
  active: "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]",
  
  normal: isDarkMode
    ? "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20 hover:shadow-[0_0_10px_rgba(177,156,217,0.3)]"
    : "w-20 px-3 py-1 text-xs rounded-lg transition-all duration-300 bg-white/80 dark:bg-accent-purple-light/10 text-gray-700 dark:text-accent-purple-light border border-gray-200 dark:border-accent-purple-light/30 hover:bg-gray-100 dark:hover:bg-accent-purple-light/20 hover:shadow-card-md"
});

// Main hook - much cleaner than before
export const useThemeStyles = () => {
  const { isDarkMode } = useTheme();
  
  const smallCard = createSmallCardStyles(isDarkMode);
  const text = createTextStyles(isDarkMode);
  const tdee = createTDEEStyles(isDarkMode);
  const button = createButtonStyles(isDarkMode);
  
  return {
    bigCard: BASE_STYLES.bigCard,
    smallCard: `${smallCard.base} ${smallCard.background} ${smallCard.border} ${smallCard.shadow}`,
    bigCardText: {
      title: text.title,
      h1: text.h1,
      h2: text.h2
    },
    text: {
      label: text.label,
      value: text.value,
      totalLossValue: text.totalLossValue,
      percentage: text.percentage,
      bmiCategory: text.bmiCategory
    },
    tdeeCard: tdee.card,
    tdeeText: tdee.text,
    button: (isActive: boolean = false) => isActive ? button.active : button.normal,
    textShadow: (size: 'light' | 'dark' | 'medium' | 'small' | 'accent' = 'medium') => 
      BASE_STYLES.textShadow[size],
    isDarkMode
  };
};