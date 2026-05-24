'use client';

import RouteGate from './components/RouteGate';
import { useAuth } from './components/SessionProvider';
import LoginPage from './components/LoginPage';
import { loadStoredSession, normalizeUser, saveLoginEmail, saveStoredSession } from '../lib/session';
import { login, refreshSession } from '../lib/api';

import { useEffect, useState } from 'react';


function LoginGate() {
  const { status, refresh } = useAuth();

  const [email, setEmail] = useState('doctor@helix.local');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [infoMessage, setInfoMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = loadStoredSession();
    if (stored.email) setEmail(stored.email);
    setRememberMe(stored.rememberEmail);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      const session = await login(email, password);
      const normalized = normalizeUser(session.user);
      saveStoredSession(session.accessToken, normalized, rememberMe, email);
      saveLoginEmail(email, rememberMe);
      // ensure RouteGate sees fresh state
      await refreshSession();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Validating session…</p>
        </div>
      </div>
    );
  }

  return (
    <LoginPage
      email={email}
      password={password}
      rememberMe={rememberMe}
      infoMessage={infoMessage}
      error={error}
      loading={loading}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onRememberChange={(value) => {
        setRememberMe(value);
        saveLoginEmail(email, value);
      }}
      onForgotPassword={() => setInfoMessage('Contact your Helix administrator to reset your password.')}
      onSubmit={handleSubmit}
    />
  );
}

export default function Home() {
  // RouteGate handles role-based redirects; Home only provides the login screen.
  return (
    <RouteGate>
      <LoginGate />
    </RouteGate>
  );
}

