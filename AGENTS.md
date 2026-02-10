# GLPal - AI Agent Development Guide

## 🚀 Quick Start Commands

### Development
- `npm start` - Start React dev server (http://localhost:3000)
- `npm run electron-dev` - Start Electron app with hot reload
- `npm test` - Run all tests in watch mode

### Single Test Commands
- `npm test -- --testNamePattern="specific test"` - Run single test by name
- `npm test -- --testPathPattern="filename"` - Run tests in specific file
- `npm test -- --watchAll=false` - Run tests once (CI mode)
- `npm test -- --coverage` - Run tests with coverage report

### Build & Production
- `npm run build` - Build for production (outputs to `build/`)
- `npm run electron-pack` - Build and run production Electron app
- `npm run electron` - Run Electron from built files

## 📁 Project Structure & Conventions

```
src/
├── components/          # React components (PascalCase files)
│   ├── WeightChart.tsx
│   ├── GLP1Chart.tsx
│   ├── WeightInput.tsx
│   ├── TDEECalculator.tsx
│   └── TDEEDisplay.tsx
├── utils/              # Utility functions (camelCase files)
│   └── calculations.ts
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
├── App.test.tsx        # Main test file
└── index.tsx           # Entry point
```

## 💻 Code Style Guidelines

### Import Organization
```typescript
// 1. React imports first
import React, { useState, useEffect } from 'react';

// 2. External libraries (alphabetical)
import { LineChart, Line } from 'recharts';

// 3. Internal imports (absolute paths)
import { UserProfile } from '../types';
import { calculateBMR } from '../utils/calculations';
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

### Naming Conventions
- **Components**: PascalCase (`WeightChart`, `TDEECalculator`)
- **Files**: PascalCase for components, camelCase for utilities
- **Variables/Functions**: camelCase (`calculateBMR`, `currentWeight`)
- **Constants**: UPPER_SNAKE_CASE (`ACTIVITY_LEVELS`)
- **Interfaces**: PascalCase with descriptive names (`UserProfile`, `WeightEntry`)

## 🎨 Tailwind CSS Guidelines

### Design System
- Use semantic color classes: `bg-blue-600`, `text-gray-900`
- Consistent spacing: Use Tailwind's spacing scale (2, 4, 6, 8)
- Responsive design: Mobile-first with `sm:`, `md:`, `lg:`, `xl:` prefixes
- Component styling: Use consistent utility combinations

### Common Patterns
```tsx
// Form inputs
<input className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

// Buttons
<button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200" />

// Cards
<div className="bg-white rounded-lg shadow-sm p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Title</h3>
  {/* content */}
</div>
```

## ⚡ Performance & Best Practices

### React Performance
- Use `React.memo` for components that re-render unnecessarily
- Optimize expensive calculations with `useMemo`
- Prevent recreating functions with `useCallback`
- Keep component state as local as possible

### Chart Performance
- Use `ResponsiveContainer` from Recharts for all charts
- Limit chart data points for better performance
- Use `minWidth={0}` to prevent chart overflow issues

### State Management
- Use local state for component-specific data
- Lift state up when shared between components
- Consider Zustand for complex global state needs
- Avoid prop drilling beyond 2-3 levels

## 🧪 Testing Strategies

### Test Structure
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Component from './Component';

test('descriptive test name', () => {
  // Arrange
  render(<Component prop="value" />);
  
  // Act
  fireEvent.click(screen.getByRole('button'));
  
  // Assert
  expect(screen.getByText('expected text')).toBeInTheDocument();
});
```

### Testing Guidelines
- Test user behavior, not implementation details
- Use `getByRole` for accessibility-first testing
- Mock API calls and external dependencies
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
<div className="fixed bottom-0 left-0 right-0 bg-white border-t">
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
- Don't use `!important` unless absolutely necessary
- Ensure color contrast meets accessibility standards

## 🔧 Development Workflow

### Adding New Features
1. Define TypeScript types first in `types.ts`
2. Create utility functions in `utils/` if needed
3. Build components using established patterns
4. Add comprehensive tests
5. Test responsiveness and accessibility
6. Build passes: `npm run build`

### Code Review Checklist
- [ ] TypeScript compilation passes
- [ ] Tests pass and provide good coverage
- [ ] Components are properly typed
- [ ] Responsive design works on all breakpoints
- [ ] Accessibility features are implemented
- [ ] Performance considerations addressed

### Git Integration
- Feature branches: `git checkout -b feature/new-feature`
- Commit with descriptive messages: `git commit -m "feat: add weight tracking chart"`
- Run tests before pushing: `npm test -- --watchAll=false`
- Build passes: `npm run build`

---
**Remember**: This is a health tracking application - prioritize data accuracy, user privacy, and accessibility in all development decisions.

## 🚀 Quick Start Commands

### Development
- `npm start` - Start React dev server (http://localhost:3000)
- `npm run electron-dev` - Start Electron app with hot reload
- `npm test` - Run all tests in watch mode
- `npm test -- --testNamePattern="specific test"` - Run single test by name
- `npm test -- --testPathPattern="filename"` - Run tests in specific file
- `npm test -- --watchAll=false` - Run tests once (CI mode)
- `npm test -- --coverage` - Run tests with coverage report

### Build & Production
- `npm run build` - Build for production (outputs to `build/`)
- `npm run electron-pack` - Build and run production Electron app
- `npm run electron` - Run Electron from built files

### Code Quality
- ESLint is configured via `react-scripts` with `react-app` rules
- TypeScript compiler enforces strict typing (`strict: true`)
- No separate lint command - use `npm start` which runs ESLint automatically

## 📁 Project Structure & Conventions

```
src/
├── components/          # React components (PascalCase files)
│   ├── WeightChart.tsx
│   ├── GLP1Chart.tsx
│   ├── WeightInput.tsx
│   ├── TDEECalculator.tsx
│   └── TDEEDisplay.tsx
├── utils/              # Utility functions (camelCase files)
│   └── calculations.ts
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
├── App.test.tsx        # Main test file
└── index.tsx           # Entry point
```

## 💻 Code Style Guidelines

### Import Organization
```typescript
// 1. React imports first
import React, { useState, useEffect } from 'react';

// 2. External libraries (alphabetical)
import { LineChart, Line } from 'recharts';

// 3. Internal imports (absolute paths)
import { UserProfile } from '../types';
import { calculateBMR } from '../utils/calculations';
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

### Naming Conventions
- **Components**: PascalCase (`WeightChart`, `TDEECalculator`)
- **Files**: PascalCase for components, camelCase for utilities
- **Variables/Functions**: camelCase (`calculateBMR`, `currentWeight`)
- **Constants**: UPPER_SNAKE_CASE (`ACTIVITY_LEVELS`)
- **Interfaces**: PascalCase with descriptive names (`UserProfile`, `WeightEntry`)

## 🎨 Tailwind CSS Guidelines

### Design System
- Use semantic color classes: `bg-blue-600`, `text-gray-900`
- Consistent spacing: Use Tailwind's spacing scale (2, 4, 6, 8)
- Responsive design: Mobile-first with `sm:`, `md:`, `lg:`, `xl:` prefixes
- Component styling: Use consistent utility combinations

### Common Patterns
```tsx
// Form inputs
<input className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

// Buttons
<button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200" />

// Cards
<div className="bg-white rounded-lg shadow-sm p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Title</h3>
  {/* content */}
</div>
```

## ⚡ Performance & Best Practices

### React Performance
- Use `React.memo` for components that re-render unnecessarily
- Optimize expensive calculations with `useMemo`
- Prevent recreating functions with `useCallback`
- Keep component state as local as possible

### Chart Performance
- Use `ResponsiveContainer` from Recharts for all charts
- Limit chart data points for better performance
- Use `minWidth={0}` to prevent chart overflow issues

### State Management
- Use local state for component-specific data
- Lift state up when shared between components
- Consider Zustand for complex global state needs
- Avoid prop drilling beyond 2-3 levels

## 🧪 Testing Strategies

### Test Structure
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Component from './Component';

test('descriptive test name', () => {
  // Arrange
  render(<Component prop="value" />);
  
  // Act
  fireEvent.click(screen.getByRole('button'));
  
  // Assert
  expect(screen.getByText('expected text')).toBeInTheDocument();
});
```

### Testing Guidelines
- Test user behavior, not implementation details
- Use `getByRole` for accessibility-first testing
- Mock API calls and external dependencies
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
<div className="fixed bottom-0 left-0 right-0 bg-white border-t">
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

## 🔧 Development Workflow

### Adding New Features
1. Define TypeScript types first in `types.ts`
2. Create utility functions in `utils/` if needed
3. Build components using established patterns
4. Add comprehensive tests
5. Test responsiveness and accessibility

### Code Review Checklist
- [ ] TypeScript compilation passes
- [ ] Tests pass and provide good coverage
- [ ] Components are properly typed
- [ ] Responsive design works on all breakpoints
- [ ] Accessibility features are implemented
- [ ] Performance considerations addressed

### Git Integration
- Feature branches: `git checkout -b feature/new-feature`
- Commit with descriptive messages
- Run tests before pushing: `npm test -- --watchAll=false`
- Build passes: `npm run build`

---

**Remember**: This is a health tracking application - prioritize data accuracy, user privacy, and accessibility in all development decisions.