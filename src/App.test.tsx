import React from 'react';
import { render, screen } from '@testing-library/react';
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
  const weightTrends = screen.getByText(/Weight Trends/i);
  expect(weightTrends).toBeInTheDocument();
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
