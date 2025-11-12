import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/Header';
import { setToken, removeToken } from '@/lib/auth';

describe('Header component', () => {
  afterEach(() => {
    removeToken();
  });

  it('shows login button when not authenticated', () => {
    removeToken();
    render(<Header />);
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
  });

  it('shows user info when authenticated and allows logout', async () => {
    const payload = { userId: '2', role: 'tutor', email: 'tutor@example.com', fullName: 'Tutor Two' };
    const token = `h.${btoa(JSON.stringify(payload))}.s`;
    setToken(token);
    render(<Header />);

    // user name and role badge should be visible
    expect(screen.getByText(/Tutor Two/)).toBeInTheDocument();
    expect(screen.getByText(/tutor/)).toBeInTheDocument();

    const logoutButton = screen.getByText(/Logout/i);
    fireEvent.click(logoutButton);

    // After logout, Login button should reappear
    expect(await screen.findByText(/Login/i)).toBeInTheDocument();
  });
});
