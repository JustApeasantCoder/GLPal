# GLPal - AI Agent Development Guide

Health tracking app for GLP-1 medication users with weight logging, medication tracking, and progress analytics.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Desktop**: Electron
- **State**: Zustand
- **Database**: Dexie (IndexedDB)
- **Charts**: ECharts + echarts-for-react
- **Date Handling**: date-fns
- **Testing**: Jest + React Testing Library
- **Build/Deploy**: Vite, gh-pages

## Commands

```bash
# Development
npm run dev               # Vite dev server
npm start                 # Alias for dev
npm run electron-dev      # Electron with hot reload

# Testing
npm test                  # Watch mode
npm test -- --watchAll=false  # Single run (CI)
npm test -- --testNamePattern="name"    # Single test
npm test -- --testPathPattern="filename" # Single file

# Build
npm run build             # Production build
npm run electron-pack     # Build + Electron app
npm run deploy            # Deploy to GitHub Pages
```

## Project Structure

```
src/
├── features/             # Feature modules
│   ├── dashboard/        # Dashboard view
│   ├── medication/      # Medication tracking
│   ├── peptides/        # Peptide logging
│   └── weight/          # Weight tracking
├── shared/              # Shared code
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom hooks
│   └── utils/          # Utility functions
├── stores/              # Zustand state stores
├── services/            # Business logic services
├── contexts/            # React contexts
├── core/                # Core services (time, etc.)
├── db/                  # Database configuration
├── constants/           # App constants
├── styles/              # Theme/styles
├── types.ts             # TypeScript definitions
└── App.tsx              # Main component
```

## Code Style

### Imports (order matters)
1. React: `import React, { useState } from 'react';`
2. External libs (alphabetical): `import { LineChart } from 'echarts-for-react';`
3. Internal (relative): `import { UserProfile } from '../../types';`

### Component Structure
```typescript
import React, { useState } from 'react';
import { UserProfile } from '../../types';

interface Props {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
}

const Component: React.FC<Props> = ({ profile, onUpdate }) => {
  const [state, setState] = useState<string>('');

  const handleClick = () => { /* ... */ };

  return <div>{/* JSX */}</div>;
};

export default Component;
```

### TypeScript
- Use `React.FC<T>` for components
- Define interfaces for props and data
- Avoid `any` - create proper types
- Array types: `WeightEntry[]` not `Array<WeightEntry>`
- Union types: `'male' | 'female'`

### Naming
- Components/Files: PascalCase (`WeightChart.tsx`)
- Hooks/Utils: camelCase (`useWeightMetrics.ts`)
- Stores: camelCase with Store suffix (`appStore.ts` -> `useAppStore`)
- Constants: UPPER_SNAKE_CASE

## Tailwind CSS

### Design System
- Primary: `#B19CD9` (light purple)
- Accent: `#4ADEA8` (mint green)
- Glassmorphism: `bg-black/30 backdrop-blur-lg`

### Common Patterns
```tsx
// Card
<div className="bg-black/30 backdrop-blur-lg rounded-2xl p-4 border border-[#9C7BD3]/20">

// Button
<button className="bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white rounded-md hover:shadow-[...] transition-all">

// Responsive grid
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

## State Management (Zustand)

```typescript
import { create } from 'zustand';

interface AppState {
  user: User | null;
  setUser: (user: User) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

## Database (Dexie)

```typescript
import Dexie, { Table } from 'dexie';

export interface WeightEntry {
  id?: number;
  date: string; // YYYY-MM-DD format (local time)
  weight: number;
  unit: 'kg' | 'lb';
}

class GLPalDatabase extends Dexie {
  weights!: Table<WeightEntry>;

  constructor() {
    super('GLPalDB');
    this.version(1).stores({
      weights: '++id, date, weight, unit',
    });
  }
}

export const db = new GLPalDatabase();
```

## Time Service

Always use `timeService` for date operations to ensure timezone safety and simulation mode support:

```typescript
import { timeService } from '../core/timeService';

// Get current time (respects simulation mode)
const now = timeService.now();           // timestamp in ms
const nowDate = timeService.nowDate();   // Date object

// Get date strings (always uses local timezone, NOT UTC)
const todayStr = timeService.todayString();              // "2024-01-15"
const localDate = timeService.toLocalDateString(date);   // "2024-01-15"

// Parse date strings back to Date objects
const date = timeService.parseLocalDate('2024-01-15');  // Date in local timezone

// Date math
const tomorrow = timeService.addDays(nowDate, 1);
const yesterday = timeService.subtractDays(nowDate, 1);
const daysDiff = timeService.getDaysBetween(date1, date2);

// Time simulation (for testing)
timeService.travelDays(7);   // Simulate 7 days in the future
timeService.reset();          // Reset to real time
```

### Key Rules
- **Never use `new Date().toISOString()`** for date strings - it uses UTC
- **Always use `timeService.todayString()`** instead of `new Date().toISOString().split('T')[0]`
- **All date comparisons** should use `timeService.parseLocalDate()` to avoid UTC issues

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

test('submit form', () => {
  const mockFn = jest.fn();
  render(<Form onSubmit={mockFn} />);

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

  expect(mockFn).toHaveBeenCalledWith({ name: 'John' });
});
```

Guidelines: Use `getByRole`, mock Dexie/db, test edge cases.

## Error Handling

- Validate inputs: `value > 0 && value < 500`
- Parse safely: `parseFloat(value) || 0`
- Use HTML5 validation: `min`, `max`, `required`
- Show loading states for async operations
- Wrap error-prone components in ErrorBoundary

## Architecture

- **State**: Zustand stores + React Context (theme)
- **Business logic**: Service classes with static methods
- **Data**: Dexie/IndexedDB persistence
- **Types**: Centralized in `types.ts`
- **Features**: Organized in `features/` directory

## Key Files

- `src/db/dexie.ts` - Database configuration
- `src/stores/appStore.ts` - Main Zustand store
- `src/contexts/ThemeContext.tsx` - Theme provider
- `src/services/WeightAnalytics.ts` - Weight calculations
- `src/shared/hooks/useWeightMetrics.ts` - Weight metrics hook
- `src/shared/components/` - Reusable UI components
