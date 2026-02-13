# GLPal - Health Tracker

A modern health tracking app built with React + TypeScript, featuring weight tracking, metabolic calculations, and medication monitoring.

## Features

| Feature | Description |
|---------|-------------|
| **Weight Tracking** | Daily weight logging with interactive charts, goal progress, and historical analysis |
| **Metabolic Calculator** | BMR (Mifflin-St Jeor), TDEE with activity multipliers, calorie targets for weight loss |
| **Medication Tracking** | GLP-1 medication logging, concentration curves, protocol management |
| **Dashboard** | Real-time metrics, responsive design, mobile-first layout |

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS (styling)
- ECharts (charts)
- Electron (desktop)
- localStorage (persistence)
- Jest + React Testing Library (testing)

## Quick Start

```bash
npm install
npm start          # Dev server (localhost:3000)
npm run electron-dev  # Desktop app
npm test           # Run tests
```

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start React dev server |
| `npm run electron-dev` | Electron with hot reload |
| `npm run build` | Production build |
| `npm run electron-pack` | Build + package Electron app |
| `npm test` | Run tests (watch mode) |
| `npm test -- --watchAll=false` | Single test run |

## Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI (Button, Card, Input)
│   ├── layout/          # Layout (TabManager, TabContent)
│   ├── Dashboard.tsx    # Main dashboard
│   ├── MedicationTab.tsx # Medication tracking
│   ├── WeightChart.tsx  # Weight visualization
│   ├── MedicationChart.tsx # Medication visualization
│   └── ...
├── contexts/            # React contexts (ThemeContext)
├── hooks/              # Custom hooks
│   ├── useWeightMetrics.ts
│   ├── useFilteredWeights.ts
│   ├── useUnitConversion.ts
│   └── useFormValidation.ts
├── services/            # Business logic
│   ├── MedicationService.ts  # Protocol & dose generation
│   └── WeightAnalytics.ts    # Weight calculations
├── utils/              # Utilities
│   ├── database.ts     # localStorage operations
│   ├── calculations.ts  # BMR, TDEE, concentration
│   ├── unitConversion.ts
│   └── sampleData.ts   # Demo data generation
├── constants/           # App constants
│   └── medications.ts   # Medication definitions
├── styles/             # Theme styles
├── types.ts            # TypeScript interfaces
└── App.tsx             # Root component
```

## Key Types

```typescript
interface WeightEntry {
  date: string;
  weight: number;
}

interface MedicationEntry {
  date: string;
  medication: string;
  dose: number;
  halfLifeHours: number;
  isManual?: boolean;
}

interface MedicationProtocol {
  id: string;
  medication: string;
  dose: number;
  frequencyPerWeek: number;
  startDate: string;
  stopDate: string | null;
  halfLifeHours: number;
}

interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  height: number;       // cm
  activityLevel: number; // 1.2 - 1.9
  goalWeight?: number;   // kg
  unitSystem?: 'metric' | 'imperial';
}
```

## Data Storage

All data persists in localStorage:
- `glpal_weight_entries` - Weight history
- `glpal_medication_entries` - Generated medication doses
- `glpal_medication_manual_entries` - User-logged doses
- `glpal_medication_protocol` - Active protocols
- `glpal_user_profile` - User settings

## Calculations

### BMR (Mifflin-St Jeor)
- **Men**: `(10 × weight) + (6.25 × height) - (5 × age) + 5`
- **Women**: `(10 × weight) + (6.25 × height) - (5 × age) - 161`

### Activity Multipliers
| Level | Multiplier |
|-------|------------|
| Sedentary | 1.2 |
| Lightly active | 1.375 |
| Moderately active | 1.55 |
| Very active | 1.725 |
| Extremely active | 1.9 |

### Weight Loss
- 1kg fat = 7,700 calories
- Daily deficit = `(7700 × kg/week) / 7`

---

GLPal - Your health tracking companion.
