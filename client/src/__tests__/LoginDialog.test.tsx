import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginDialog from '@/components/LoginDialog';
import * as auth from '@/lib/auth';

import { vi } from 'vitest';

describe('LoginDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('calls login and triggers onLogin callback when logging in', async () => {
    const mockResponse = { token: 'h.' + btoa(JSON.stringify({ userId: '1', role: 'student', fullName: 'Student' })) + '.s' };
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockResponse) })) as any);

    const onLogin = vi.fn();
    render(<LoginDialog onLogin={onLogin} />);

    // open dialog
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    // fill form
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'student@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });

    fireEvent.click(screen.getByRole('button', { name: /Login$/i }));

    await waitFor(() => expect(onLogin).toHaveBeenCalled());
  });

  it('calls register when switching to register and submitting', async () => {
    const mockResponse = { token: 'h.' + btoa(JSON.stringify({ userId: '2', role: 'tutor', fullName: 'Tutor' })) + '.s' };
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockResponse) })) as any);

    const onLogin = vi.fn();
    render(<LoginDialog onLogin={onLogin} />);

    // open dialog and switch to register
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    fireEvent.click(screen.getByText(/Need an account\? Register/i));

    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: 'Tutor' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'tutor@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });

    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    await waitFor(() => expect(onLogin).toHaveBeenCalled());
  });
});
