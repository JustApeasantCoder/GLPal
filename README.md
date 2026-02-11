# GLPal - Health Tracker

A modern health tracking application built with React and TypeScript, featuring weight tracking, TDEE calculations, and GLP-1 medication monitoring.

## Features

### 🏃 Weight Tracking
- Daily weight input with validation
- Interactive trend visualization with multiple time periods
- Goal tracking with progress metrics
- Historical data analysis

### 🔥 Metabolic Calculator
- Mifflin-St Jeor BMR calculations
- TDEE calculation with activity levels
- Personalized calorie targets for weight loss rates
- Real-time calculations based on current weight

### 💊 GLP-1 Tracking
- Medication dose tracking
- Blood concentration visualization
- Half-life calculations for common GLP-1 medications
- Accumulation and decay curves

### 📊 Dashboard
- Clean, responsive design with Tailwind CSS
- Tabbed navigation (Dashboard, Weight, GLP-1)
- Real-time performance metrics
- Mobile-first responsive layout

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Charts**: Recharts for data visualization
- **Styling**: Tailwind CSS
- **Desktop**: Electron for cross-platform deployment
- **Storage**: localStorage-based database
- **Testing**: Jest + React Testing Library

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Start Electron desktop app
npm run electron-dev

# Run tests
npm test
```

## Development Commands

```bash
npm start              # Web development server
npm run electron-dev    # Electron with hot reload
npm run build         # Production build
npm run electron-pack  # Build and run Electron
npm test              # Run tests
npm test --coverage    # Tests with coverage
```

## Project Structure

```
src/
├── components/        # React components
│   ├── Dashboard.tsx
│   ├── WeightTab.tsx
│   ├── GLP1Tab.tsx
│   ├── Navigation.tsx
│   └── ...
├── contexts/         # React contexts
├── utils/           # Utility functions
├── types.ts         # TypeScript definitions
└── App.tsx          # Main application
```

## Data Persistence

The application uses localStorage for data persistence:
- Weight entries and historical data
- GLP-1 medication records
- User profile settings
- Automatic data initialization with sample data on first run

## Calculations

### TDEE Formula (Mifflin-St Jeor)
- **Men**: `(10 × weight) + (6.25 × height) - (5 × age) + 5`
- **Women**: `(10 × weight) + (6.25 × height) - (5 × age) - 161`

### Activity Levels
- Sedentary: 1.2 → Lightly active: 1.375 → Moderately active: 1.55
- Very active: 1.725 → Extremely active: 1.9

### Weight Loss
- 1kg fat = 7,700 calories
- Calorie deficit calculated for 0.5kg and 1.0kg/week targets

---

**GLPal** - Your comprehensive health tracking companion.