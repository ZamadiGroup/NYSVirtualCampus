import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/lib/useAuth';
import { setToken, removeToken } from '@/lib/auth';

function TestComponent() {
  const { user } = useAuth();
  return <div data-testid="user">{user ? `${user.role} ${user.fullName}` : 'no-user'}</div>;
}

describe('useAuth hook', () => {
  afterEach(() => {
    removeToken();
  });

  it('returns null user when no token exists', () => {
    removeToken();
    render(<TestComponent />);
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('parses token and returns current user', () => {
    const payload = { userId: '1', role: 'tutor', email: 'tutor@example.com', fullName: 'Tutor One' };
    const token = `h.${btoa(JSON.stringify(payload))}.s`;
    setToken(token);
    render(<TestComponent />);
    expect(screen.getByTestId('user')).toHaveTextContent('tutor Tutor One');
  });
});
