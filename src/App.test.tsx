import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders GLPal Health Tracker', () => {
  render(<App />);
  const headerElement = screen.getByText(/GLPal - Health Tracker/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders weight tracking form', () => {
  render(<App />);
  const weightInput = screen.getByLabelText(/weight/i);
  expect(weightInput).toBeInTheDocument();
});

test('renders TDEE calculator', () => {
  render(<App />);
  const tdeeButton = screen.getByText(/calculate tdee/i);
  expect(tdeeButton).toBeInTheDocument();
});

test('renders bottom navigation tabs', () => {
  render(<App />);
  const weightTab = screen.getByText('Weight');
  const glp1Tab = screen.getByText('GLP-1');
  const tdeeTab = screen.getByText('TDEE');
  
  expect(weightTab).toBeInTheDocument();
  expect(glp1Tab).toBeInTheDocument();
  expect(tdeeTab).toBeInTheDocument();
});

test('default active tab is weight', () => {
  render(<App />);
  const weightTab = screen.getByText('Weight');
  
  expect(weightTab.parentElement).toHaveClass('bg-blue-500', 'text-white');
});
