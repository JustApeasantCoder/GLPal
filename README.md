# GLPal - Health Tracker

A comprehensive desktop health tracking application built with React, TypeScript, and Electron.

## Features

### 🏃 Weight Tracking
- Daily weight input with validation
- Weight trend visualization with Recharts
- Goal weight tracking with progress display
- Historical weight data analysis

### 🔥 TDEE Calculator
- **Mifflin-St Jeor BMR calculation** (most accurate formula)
- Activity level multipliers (sedentary to extremely active)
- Real-time TDEE calculation based on current weight
- Personalized calorie targets for different weight loss rates:
  - 0.5 kg/week (slow and sustainable)
  - 1.0 kg/week (moderate pace)

### 💊 GLP-1 Dose Tracking
- Medication dose input and storage
- **Half-life concentration calculations** for:
  - Semaglutide (7 days half-life)
  - Liraglutide (13 hours half-life)
  - Tirzepatide (5 days half-life)
- Real-time blood concentration visualization
- Accumulation and decay curves over time

### 🎨 Professional Dashboard
- Clean, branded design with Tailwind CSS
- Responsive grid layout
- Color-coded statistics cards
- Intuitive user interface
- Real-time data updates

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Charts**: Recharts for beautiful, responsive visualizations
- **Styling**: Tailwind CSS for custom branded design
- **Desktop**: Electron for cross-platform deployment
- **State Management**: React Hooks

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
```

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
│   │   └── TDEEDisplay.tsx
│   ├── utils/            # Utility functions
│   │   └── calculations.ts
│   └── types.ts          # TypeScript type definitions
└── package.json          # Dependencies and scripts
```

## Future Mobile Development

When ready for mobile deployment:

- **React Native** can reuse ~60-70% of codebase
- Business logic (calculations, data structures) transfers directly
- Recharts → React Native Chart Kit for mobile charts
- Same TypeScript types and calculation utilities

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