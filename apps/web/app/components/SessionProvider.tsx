'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '../../lib/types';
import { loadStoredSession, normalizeUser, saveStoredSession, clearStoredSession } from '../../lib/session';
import { refreshSession } from '../../lib/api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  token: string;
  rememberEmail: boolean;
  login: (params: { email: string; password: string; rememberMe: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const bootIdRef = useRef(0);

  const [{ status, user, token, rememberEmail }, setState] = useState<{
    status: AuthStatus;
    user: User | null;
    token: string;
    rememberEmail: boolean;
  }>({ status: 'loading', user: null, token: '', rememberEmail: true });

  const refreshOnce = useCallback(async () => {
    const bootId = ++bootIdRef.current;

    const stored = loadStoredSession();
    if (!stored.token || !stored.user) {
      setState((s) => ({ ...s, status: 'unauthenticated', user: null, token: '', rememberEmail: stored.rememberEmail }));
      return;
    }

    try {
      setState((s) => ({ ...s, status: 'loading' }));
      const session = await refreshSession();
      if (bootId !== bootIdRef.current) return;

      const normalized = normalizeUser(session.user);
      setState({ status: 'authenticated', user: normalized, token: session.accessToken, rememberEmail: stored.rememberEmail });
      saveStoredSession(session.accessToken, normalized, stored.rememberEmail, session.user.email);
    } catch {
      if (bootId !== bootIdRef.current) return;
      clearStoredSession();
      setState((s) => ({ ...s, status: 'unauthenticated', user: null, token: '', rememberEmail: stored.rememberEmail }));
    }
  }, []);

  const login = useCallback(
    async () => { // login is handled by the calling page via api.login; provider centralizes refresh/logout/storage.
      // Implemented in pages after login endpoint call; provider only centralizes refresh/logout/storage.
      // We keep this signature to prevent scattered state updates.
      // The actual token/user is set by caller after login.
      throw new Error('SessionProvider.login should not be called directly. Use authClient.login().');
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      // keep cookie-based refresh revocation in api layer; not invoked here to avoid circular deps.
      // pages will call api.logout() and then we clear storage.
    } finally {
      clearStoredSession();
      setState((s) => ({ ...s, status: 'unauthenticated', user: null, token: '', rememberEmail: false }));
    }
  }, []);

  const refresh = useCallback(async () => {
    await refreshOnce();
  }, [refreshOnce]);

  useEffect(() => {
    // deterministic boot
    refreshOnce().finally(() => {});
  }, [refreshOnce]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      token,
      rememberEmail,
      login,
      logout,
      refresh,
    }),
    [status, user, token, rememberEmail, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

