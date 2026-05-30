import { useCallback, useEffect, useState } from 'react';
import { fetchCurrentUser, getLoginUrl, logoutUser } from '../lib/authApi';
import type { AuthUser } from '../lib/types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const data = await fetchCurrentUser();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInitialUser = async () => {
      try {
        const data = await fetchCurrentUser();
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(() => {
    window.location.href = getLoginUrl();
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refreshUser,
  };
}
