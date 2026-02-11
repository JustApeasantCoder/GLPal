# GLPal - Health Tracker

A comprehensive health tracking application built with React, TypeScript, and Electron featuring persistent data storage and intelligent calculations.

## Features

### 🏃 Weight Tracking
- Daily weight input with validation
- **90-day simulated weight progression** (103kg to 85kg)
- Weight trend visualization with Recharts
- Goal weight tracking with progress display
- Historical weight data analysis
- **Persistent data storage** using localStorage

### 🔥 TDEE Calculator
- **Mifflin-St Jeor BMR calculation** (most accurate formula)
- Activity level multipliers (sedentary to extremely active)
- Real-time TDEE calculation based on current weight
- Personalized calorie targets for different weight loss rates:
  - 0.5 kg/week (slow and sustainable) - ~550 cal deficit
  - 1.0 kg/week (moderate pace) - ~1100 cal deficit
- **Profile persistence** across app sessions
- Accurate calorie deficit calculations

### 💊 GLP-1 Dose Tracking
- Medication dose input and storage
- **Half-life concentration calculations** for:
  - Semaglutide (7 days half-life)
  - Liraglutide (13 hours half-life)
  - Tirzepatide (5 days half-life)
- Real-time blood concentration visualization
- Accumulation and decay curves over time
- Sample medication entries in simulated data

### 🎨 Professional Dashboard
- Clean, branded design with Tailwind CSS
- Responsive grid layout with mobile-first design
- Color-coded statistics cards
- Intuitive user interface with tabbed navigation
- Real-time data updates
- **Error boundary** for graceful error handling
- **Dark mode** support with smooth transitions

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Charts**: Recharts for beautiful, responsive visualizations
- **Styling**: Tailwind CSS for custom branded design
- **Desktop**: Electron for cross-platform deployment
- **State Management**: React Hooks
- **Data Storage**: localStorage-based database simulation
- **Error Handling**: React Error Boundaries
- **Build Tools**: Create React App with TypeScript

## Getting Started

### Prerequisites
- Node.js 14+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Start development server (web version)
npm start

# Start Electron desktop app
npm run electron-dev

# Build for production
npm run build

# Run production Electron app
npm run electron-pack
```

### Development

```bash
# Web development (port 3000)
npm start

# Electron desktop app with hot reload
npm run electron-dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### First Run

The application automatically initializes with **90 days of simulated weight data** showing a progression from 103kg to 85kg with realistic:
- Daily fluctuations (±0.3kg)
- Weekend weight variations  
- Occasional plateau periods
- Sample GLP-1 medication entries

Data persists automatically using localStorage in your browser.

## Project Structure

```
├── public/                 # Static assets and Electron main process
│   ├── electron.js         # Electron main process
│   └── index.html         # HTML template
├── src/                  # React application source
│   ├── components/        # React components
│   │   ├── WeightChart.tsx
│   │   ├── GLP1Chart.tsx
│   │   ├── WeightInput.tsx
│   │   ├── TDEECalculator.tsx
│   │   ├── TDEEDisplay.tsx
│   │   ├── SettingsDropdown.tsx
│   │   └── ErrorBoundary.tsx
│   ├── contexts/          # React contexts
│   │   └── ThemeContext.tsx
│   ├── utils/            # Utility functions
│   │   ├── calculations.ts
│   │   ├── database.ts     # localStorage-based database
│   │   └── generateData.ts # Simulated data generator
│   ├── types.ts          # TypeScript type definitions
│   ├── App.tsx           # Main application component
│   ├── App.test.tsx      # Main test file
│   ├── index.tsx         # Application entry point
│   └── index.css         # Global styles
├── scripts/              # Build and utility scripts
│   └── initDatabase.ts   # Database initialization
└── package.json          # Dependencies and scripts
```

## Recent Updates

### v1.1.0 - Database Integration & Bug Fixes
- ✅ **Database Implementation**: localStorage-based persistent storage
- ✅ **Simulated Data Generation**: 90-day weight progression (103kg → 85kg)
- ✅ **Profile Persistence**: User settings saved across sessions
- ✅ **Error Boundaries**: Graceful error handling with user-friendly messages
- ✅ **TDEE Calculation Fix**: Accurate calorie deficit displays
- ✅ **Infinite Loop Fix**: Resolved white screen crash issue
- ✅ **Safety Checks**: localStorage availability and error handling

## Future Mobile Development

When ready for mobile deployment:

- **React Native** can reuse ~60-70% of codebase
- Business logic (calculations, data structures) transfers directly
- Recharts → React Native Chart Kit for mobile charts
- Same TypeScript types and calculation utilities
- Database layer can be adapted to SQLite or AsyncStorage

## Data Calculations

### TDEE Formula
**Mifflin-St Jeor Equation:**
- Men: `(10 × weight kg) + (6.25 × height cm) - (5 × age) + 5`
- Women: `(10 × weight kg) + (6.25 × height cm) - (5 × age) - 161`

### Activity Multipliers
- Sedentary: 1.2
- Lightly active: 1.375
- Moderately active: 1.55
- Very active: 1.725
- Extremely active: 1.9

### Weight Loss Calorie Deficit
- 1kg fat = 7,700 calories
- Daily deficit = `(7700 × target kg) / 7 days`

### GLP-1 Half-Life
Concentration calculated using exponential decay:
```
Concentration = Σ(Dose × e^(-0.693 × hoursElapsed / halfLifeHours))
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is private and proprietary.

---

**GLPal** - Your comprehensive health tracking companion.