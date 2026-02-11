import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

test('renders GLPal Dashboard', () => {
  renderWithTheme(<App />);
  const headerElement = screen.getByRole('heading', { name: /Dashboard/i });
  expect(headerElement).toBeInTheDocument();
});

test('renders weight trends chart', () => {
  renderWithTheme(<App />);
  
  // Switch to weight tab
  const weightTab = screen.getByRole('button', { name: /Weight/i });
  fireEvent.click(weightTab);
  
  // Check if weight chart renders
  expect(screen.getByText('Weight Trends')).toBeInTheDocument();
});

test('renders Performance Overview in Dashboard', () => {
  renderWithTheme(<App />);
  
  // Should see Performance Overview header in dashboard
  expect(screen.getByText('Performance Overview')).toBeInTheDocument();
  
  // Should see performance metrics
  expect(screen.getByText('Progress Rate')).toBeInTheDocument();
  expect(screen.getByText('Best Week')).toBeInTheDocument();
  expect(screen.getByText('Time Active')).toBeInTheDocument();
});

test('renders settings dropdown', () => {
  renderWithTheme(<App />);
  const settingsButton = screen.getByLabelText('Settings');
  expect(settingsButton).toBeInTheDocument();
});

test('renders bottom navigation tabs', () => {
  renderWithTheme(<App />);
  const dashboardTab = screen.getByRole('button', { name: /Dashboard/i });
  const glp1Tab = screen.getByRole('button', { name: /GLP-1/i });
  
  expect(dashboardTab).toBeInTheDocument();
  expect(glp1Tab).toBeInTheDocument();
});

test('default active tab is dashboard', () => {
  renderWithTheme(<App />);
  const dashboardTab = screen.getByRole('button', { name: /Dashboard/i });
  
  expect(dashboardTab).toHaveClass('from-[#B19CD9]', 'text-white');
});
