// client-side auth helpers: login, logout, token management, and user parsing
export const TOKEN_KEY = 'token';

export type CurrentUser = {
  userId: string;
  role: 'student' | 'tutor' | 'admin';
  email?: string;
  fullName?: string;
  iat?: number;
  exp?: number;
};

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function parseJwt(token?: string | null): CurrentUser | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded as CurrentUser;
  } catch (e) {
    return null;
  }
}

export async function login(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || err.message || 'Login failed');
  }

  const data = await res.json();
  if (data?.token) {
    setToken(data.token);
  }
  return data;
}

export async function register(fullName: string, email: string, password: string, role: string = 'student') {
  // Public registration must not create admin accounts. Reject early if client requests admin.
  if (role === 'admin') {
    throw new Error('Admin accounts cannot be created via public registration. Please contact an administrator.');
  }

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, password, role }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(err.error || err.message || 'Registration failed');
  }

  const data = await res.json();
  if (data?.token) setToken(data.token);
  return data;
}

export function getCurrentUser(): CurrentUser | null {
  const token = getToken();
  return parseJwt(token);
}
