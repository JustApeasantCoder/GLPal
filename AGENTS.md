# GLPal - AI Agent Development Guide

Welcome to the GLPal health tracking application! This guide provides comprehensive instructions for AI agents working in this React/TypeScript codebase.

## 🚀 Quick Start Commands

### Development
```bash
npm start                    # React dev server (http://localhost:3000)
npm run electron-dev          # Electron app with hot reload
```

### Testing
```bash
npm test                     # Run tests in watch mode
npm test -- --testNamePattern="specific test"    # Run single test by name
npm test -- --testPathPattern="filename"           # Run tests in specific file
npm test -- --watchAll=false          # Run tests once (CI mode)
npm test -- --coverage              # Run tests with coverage report
```

### Build & Production
```bash
npm run build               # Build for production (outputs to `build/`)
npm run electron-pack        # Build and run production Electron app
npm run electron              # Run Electron from built files
```

## 📁 Project Structure & Conventions

```
src/
├── components/          # React components (PascalCase files)
│   ├── Dashboard.tsx
│   ├── WeightTab.tsx
│   ├── GLP1Tab.tsx
│   ├── Navigation.tsx
│   ├── WeightChart.tsx
│   ├── GLP1Chart.tsx
│   ├── WeightInput.tsx
│   ├── TDEEDisplay.tsx
│   ├── PerformanceOverview.tsx
│   ├── SettingsDropdown.tsx
│   └── TDEECalculator.tsx
├── hooks/              # Custom React hooks
│   ├── useWeightMetrics.ts
│   ├── useFilteredWeights.ts
│   └── index.ts
├── services/           # Business logic services
│   ├── WeightAnalytics.ts
│   └── index.ts
├── utils/              # Utility functions (camelCase files)
│   ├── calculations.ts
│   ├── database.ts
│   └── generateData.ts
├── contexts/           # React contexts
│   └── ThemeContext.tsx
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
├── App.test.tsx        # Main test file
└── index.tsx           # Application entry point
```

## 💻 Code Style Guidelines

### Import Organization
```typescript
// 1. React imports first
import React, { useState, useEffect, useCallback } from 'react';

// 2. External libraries (alphabetical)
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { render, screen, fireEvent } from '@testing-library/react';

// 3. Internal imports (use relative paths)
import { UserProfile, WeightEntry } from '../types';
import { WeightAnalytics } from '../services';
import { useWeightMetrics } from '../hooks';
import WeightChart from './WeightChart';
```

### Component Structure
```typescript
// 1. Imports
import React, { useState } from 'react';
import { UserProfile } from '../types';

// 2. Interface definitions (if any)
interface ComponentProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

// 3. Component implementation (React.FC)
const Component: React.FC<ComponentProps> = ({ profile, onUpdate }) => {
  // 4. Hooks (useState, useEffect, etc.)
  const [localState, setLocalState] = useState<string>('');

  // 5. Event handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // handler logic
  };

  // 6. Render JSX
  return (
    <div className="component-wrapper">
      {/* JSX content */}
    </div>
  );
};

export default Component;
```

### TypeScript Conventions
- Use `React.FC<T>` for functional components with props
- Define interfaces for all complex data structures
- Use strict typing (no `any` unless absolutely necessary)
- Union types for limited string sets: `'male' | 'female'`
- Array types: `WeightEntry[]` instead of `Array<WeightEntry>`
- Service classes with static methods for business logic

### Naming Conventions
- **Components**: PascalCase (`WeightChart`, `TDEECalculator`)
- **Files**: PascalCase for components, camelCase for utilities
- **Variables/Functions**: camelCase (`calculateBMR`, `currentWeight`)
- **Constants**: UPPER_SNAKE_CASE (`ACTIVITY_LEVELS`)
- **Interfaces**: PascalCase with descriptive names (`UserProfile`, `WeightEntry`)

## 🎨 Tailwind CSS Guidelines

### Design System
- **Color Palette**: Purple-based gradient theme
  - Primary: `#B19CD9` (light purple)
  - Secondary: `#9C7BD3` (medium purple) 
  - Dark: `#2D1B4E` (deep purple)
  - Accent: `#4ADEA8` (mint green)
  - Background: `#0D0A15` to `#2D1B4E` (gradient)

- **Consistent spacing**: Use Tailwind's spacing scale (2, 3, 4, 6, 8)
- **Responsive design**: Mobile-first with `sm:`, `md:`, `lg:`, `xl:` prefixes
- **Glass morphism effects**: `bg-black/30 backdrop-blur-lg`

### Common Patterns
```tsx
// Glass morphism cards
<div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(156,123,211,0.2)] p-4 border border-[#9C7BD3]/20">
  <h3 className="text-lg font-semibold text-[#4ADEA8] mb-4">Title</h3>
  {/* content */}
</div>

// Gradient buttons
<button className="bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white px-4 py-2 rounded-md hover:shadow-[0_0_15px_rgba(74,222,168,0.4)] transition-all duration-300">
  Button
</button>

// Form inputs
<input className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
```

## ⚡ Performance & Best Practices

### React Performance
- Use `React.memo` for components that re-render unnecessarily
- Optimize expensive calculations with `useMemo`
- Prevent recreating functions with `useCallback`
- Keep component state as local as possible
- Use `React.FC` for better TypeScript inference

### Chart Performance
- Use `ResponsiveContainer` from Recharts for all charts
- Limit chart data points for better performance
- Use `minWidth={0}` to prevent chart overflow issues
- Memoize chart data processing

### State Management
- Use local state for component-specific data
- Lift state up when shared between components
- Use React Context for global state (theme, user settings)
- Avoid prop drilling beyond 2-3 levels

## 🧪 Testing Strategies

### Test Structure
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Theme wrapper for consistent testing
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};
```

### Testing Guidelines
- Test user behavior, not implementation details
- Use `getByRole` for accessibility-first testing
- Mock localStorage and external dependencies
- Test edge cases: empty states, error conditions, invalid inputs
- Each test should have one clear assertion about behavior

### Common Test Patterns
```typescript
// Form submission
test('submits form with valid data', () => {
  const mockSubmit = jest.fn();
  render(<Form onSubmit={mockSubmit} />);
  
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
  
  expect(mockSubmit).toHaveBeenCalledWith({ name: 'John' });
});

// Component rendering
test('displays user profile information', () => {
  const profile = { name: 'John', age: 30 };
  render(<Profile profile={profile} />);
  
  expect(screen.getByText('John')).toBeInTheDocument();
  expect(screen.getByText('30 years old')).toBeInTheDocument();
});
```

## 🔧 Development Workflow

### Adding New Features
1. **Define TypeScript types first** in `types.ts`
2. **Create utility functions** in `utils/` if needed
3. **Build components** using established patterns
4. **Add comprehensive tests** for new functionality
5. **Test responsiveness** and accessibility
6. **Verify performance** doesn't degrade

### Code Review Checklist
- [ ] TypeScript compilation passes
- [ ] Tests pass and provide good coverage
- [ ] Components are properly typed
- [ ] Responsive design works on all breakpoints
- [ ] Accessibility features are implemented
- [ ] Performance considerations addressed

### Git Integration
- **Feature branches**: `git checkout -b feature/amazing-feature`
- **Commit with descriptive messages**: `git commit -m "feat: add weight tracking chart"`
- **Run tests before pushing**: `npm test -- --watchAll=false`
- **Build passes**: `npm run build`

## 📊 Data Architecture

### Storage Strategy
- **localStorage-based persistence** for user data
- **Separate utilities** for database operations in `utils/database.ts`
- **Data generation utilities** in `utils/generateData.ts`
- **Error handling** for localStorage availability

### Data Models
```typescript
// Core data types
interface WeightEntry {
  date: string;
  weight: number;
}

interface GLP1Entry {
  date: string;
  dose: number;
  concentration: number;
}

interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  height: number; // cm
  activityLevel: number;
  goalWeight?: number;
}
```

## 🔄 Error Handling & User Feedback

### Input Validation
- Validate numbers with range checks: `value > 0 && value < 500`
- Provide clear error messages for invalid inputs
- Use HTML5 validation attributes: `min`, `max`, `required`
- Parse strings safely: `parseFloat(value) || 0`

### User Feedback
- Show loading states for async operations
- Display success/error messages for user actions
- Use hover states and transitions for better UX
- Provide visual feedback for form validation

### Error Boundaries
- Wrap potentially error-prone components in error boundaries
- Log errors for debugging
- Show user-friendly error messages

## 📱 Mobile-First Responsive Design

### Breakpoints (Tailwind defaults)
- `sm:` 640px and up (tablet portrait)
- `md:` 768px and up (tablet landscape)
- `lg:` 1024px and up (laptop)
- `xl:` 1280px and up (desktop)

### Responsive Patterns
```tsx
// Grid layouts
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* stacked on mobile, side-by-side on desktop */}
</div>

// Navigation
<div className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t">
  {/* mobile bottom navigation */}
</div>
<div className="hidden md:block">
  {/* desktop top navigation */}
</div>

// Typography
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
```

## ⚠️ Common Pitfalls to Avoid

### TypeScript
- Don't use `any` - create proper type definitions
- Avoid type assertions unless absolutely necessary
- Use proper generic types for reusable components

### React
- Don't mutate props or state directly
- Avoid inline object/array definitions in JSX (causes re-renders)
- Don't use index as key in lists when order changes

### Styling
- Avoid arbitrary values excessively - stick to Tailwind's scale
- Don't use !important unless absolutely necessary
- Ensure color contrast meets accessibility standards

## 🔍 Component Library Patterns

### Reusable Components
```typescript
// Metric cards (used throughout the app)
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}

// Chart period selector (reused across components)
interface ChartPeriodSelectorProps {
  period: ChartPeriod;
  onPeriodChange: (period: ChartPeriod) => void;
}
```

### Custom Hooks Patterns
```typescript
// Data filtering logic
const useFilteredWeights = (weights: WeightEntry[], period: ChartPeriod) => {
  return useMemo(() => {
    // filtering logic
  }, [weights, period]);
};

// Metrics calculation
const useWeightMetrics = (weights: WeightEntry[], profile: UserProfile) => {
  return useMemo(() => {
    // calculation logic
  }, [weights, profile]);
};
```

## 🛠️ Architecture Patterns

### Service Layer
```typescript
// Business logic separation
export class WeightAnalytics {
  static calculateMetrics(weights: WeightEntry[]): WeightMetrics {
    // complex calculations
  }
  
  static calculateBestWeek(weights: WeightEntry[]): number {
    // specialized calculations
  }
}
```

### State Management
- Local component state for component-specific data
- React Context for global state (theme, user settings)
- Custom hooks for complex stateful logic
- Service classes for business calculations

---

**Important**: This health tracking application prioritizes data accuracy, user privacy, and accessibility in all development decisions.