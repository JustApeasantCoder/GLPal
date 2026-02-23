/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Background colors
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        
        // Text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        
        // Border and UI colors
        'border-ui': 'var(--border-color)',
        'card-bg': 'var(--card-bg)',
        'card-border': 'var(--card-border)',
        
        // Accent colors
        'accent-purple-light': 'var(--accent-purple-light)',
        'accent-purple-medium': 'var(--accent-purple-medium)',
        'accent-purple-dark': 'var(--accent-purple-dark)',
        'accent-mint': 'var(--accent-mint)',
        
        // Gradient colors
        'gradient-start': 'var(--gradient-start)',
        'gradient-mid': 'var(--gradient-mid)',
        'gradient-end': 'var(--gradient-end)',
        
        // Shadow color
        'shadow-theme': 'var(--shadow-color)',
      },
      backgroundImage: {
        'theme-gradient': 'linear-gradient(to right, var(--gradient-start), var(--gradient-mid), var(--gradient-end))',
        'theme-gradient-vertical': 'linear-gradient(to bottom, var(--gradient-start), var(--gradient-mid), var(--gradient-end))',
      },
      boxShadow: {
        'theme': '0 8px 32px var(--shadow-color)',
        'theme-lg': '0 12px 48px var(--shadow-color)',
        'card-sm': '0 0 5px rgba(177,156,217,0.3)',
        'card-md': '0 0 10px rgba(177,156,217,0.3)',
        'card-lg': '0 0 20px rgba(177,156,217,0.3)',
        'button': '0 0 15px rgba(177,156,217,0.4)',
      },
    },
  },
  plugins: [],
}