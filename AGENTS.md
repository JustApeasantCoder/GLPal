# GLPal - AI Agent Development Guide

React/TypeScript health tracking app with Electron, Tailwind CSS, and Jest.

## Commands

```bash
# Development
npm start                     # React dev server (localhost:3000)
npm run electron-dev          # Electron with hot reload

# Testing
npm test                      # Watch mode
npm test -- --watchAll=false  # Single run (CI)
npm test -- --testNamePattern="name"    # Single test
npm test -- --testPathPattern="filename" # Single file

# Build
npm run build                 # Production build
npm run electron-pack         # Build + Electron app
```

## Project Structure

```
src/
├── components/         # React components (PascalCase)
│   ├── ui/            # Reusable UI components
│   └── layout/        # Layout components
├── hooks/             # Custom hooks (useXxx.ts)
├── services/          # Business logic (static methods)
├── utils/             # Utility functions (camelCase)
├── contexts/          # React contexts
├── styles/            # Theme/style utilities
├── types.ts           # TypeScript definitions
└── App.tsx            # Main component
```

## Code Style

### Imports (order matters)
1. React: `import React, { useState } from 'react';`
2. External libs (alphabetical): `import { LineChart } from 'recharts';`
3. Internal (relative): `import { UserProfile } from '../types';`

### Component Structure
```typescript
import React, { useState } from 'react';
import { UserProfile } from '../types';

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

Guidelines: Use `getByRole`, mock localStorage, test edge cases.

## Error Handling

- Validate inputs: `value > 0 && value < 500`
- Parse safely: `parseFloat(value) || 0`
- Use HTML5 validation: `min`, `max`, `required`
- Show loading states for async operations
- Wrap error-prone components in ErrorBoundary

## Architecture

- **State**: Local state + React Context (theme, settings)
- **Business logic**: Service classes with static methods
- **Data**: localStorage persistence via `utils/database.ts`
- **Types**: Centralized in `types.ts`

## Key Files

- `src/contexts/ThemeContext.tsx` - Theme provider
- `src/services/WeightAnalytics.ts` - Weight calculations
- `src/hooks/useWeightMetrics.ts` - Weight metrics hook
- `src/components/ui/` - Reusable UI components
