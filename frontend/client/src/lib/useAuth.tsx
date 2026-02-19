import { useEffect, useState, useCallback } from 'react';
import { getCurrentUser as _getCurrentUser, getToken, removeToken } from './auth';

export type CurrentUser = ReturnType<typeof _getCurrentUser>;

export function useAuth() {
  const [user, setUser] = useState<CurrentUser | null>(() => _getCurrentUser());

  useEffect(() => {
    const handler = () => setUser(_getCurrentUser());

    // listen for storage changes from other tabs
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const refresh = useCallback(() => {
    setUser(_getCurrentUser());
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  const isAuthenticated = !!user;
  const hasRole = (roles: string[]) => user ? roles.includes(user.role) : false;

  return { user, isAuthenticated, hasRole, refresh, logout } as const;
}
