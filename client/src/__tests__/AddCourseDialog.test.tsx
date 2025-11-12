import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setToken } from '@/lib/auth';
import { AddCourseDialog } from '@/components/AddCourseDialog';
import { vi } from 'vitest';

vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

describe('AddCourseDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('prevents submit when not authenticated and shows toast', async () => {
    const toast = (await import('@/hooks/use-toast')).toast as any;
    render(<AddCourseDialog />);

    fireEvent.click(screen.getByTestId('button-add-course'));

    // Try submit without filling required title — button exists
    fireEvent.click(screen.getByRole('button', { name: /Create Course/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });
  });

  it('submits course when authenticated and API returns success', async () => {
    const courseResponse = { enrollmentKey: 'ABC123' };
    vi.stubGlobal('fetch', vi.fn((url: string, options: any) => {
      if (url.endsWith('/api/courses') || url === '/api/courses') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(courseResponse) } as any);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as any);
    }) as any);

    setToken('h.' + btoa(JSON.stringify({ userId: '3', role: 'tutor', fullName: 'Tutor' })) + '.s');

    const toastModule = await import('@/hooks/use-toast');
    const toast = toastModule.toast as any;

    render(<AddCourseDialog />);
    fireEvent.click(screen.getByTestId('button-add-course'));

    fireEvent.change(screen.getByLabelText(/Course Title/i), { target: { value: 'Test Course' } });
    fireEvent.change(screen.getByLabelText(/Department/i), { target: { value: 'Testing' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Course/i }));

    await waitFor(() => expect(toast).toHaveBeenCalled());
    // verify fetch called for courses
    expect((global.fetch as any)).toHaveBeenCalled();
  });
});
