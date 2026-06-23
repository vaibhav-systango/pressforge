import React from 'react';
import { render, screen, fireEvent } from '@/lib/test-utils';
import { DashboardScreen } from './DashboardScreen';

// Mock useRouter from next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
}));

describe('DashboardScreen Component', () => {
  it('renders Dashboard header and boilerplate information', () => {
    render(<DashboardScreen />);
    
    // Check main elements
    expect(screen.getByText('System Workspace')).toBeInTheDocument();
    expect(screen.getByText(/A production-grade, secure, and role-guarded framework/)).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-canvas')).toBeInTheDocument();
    expect(screen.getByText('Design Canvas Ready')).toBeInTheDocument();
  });

  it('renders theme switcher and triggers color scheme changes', () => {
    render(<DashboardScreen />);
    
    const themeBtn = screen.getByTestId('btn-toggle-theme');
    expect(themeBtn).toBeInTheDocument();
    
    // Test that the button is clickable
    fireEvent.click(themeBtn);
  });

  it('provides a logout action button', () => {
    render(<DashboardScreen />);
    
    const logoutBtn = screen.getByTestId('btn-logout');
    expect(logoutBtn).toBeInTheDocument();
    expect(logoutBtn).toHaveTextContent('Log Out');
  });
});
