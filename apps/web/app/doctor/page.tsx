'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DoctorDashboard from '../components/DoctorDashboard';
import LoginPage from '../components/LoginPage';
import { login, refreshSession } from '../../lib/api';
import { clearStoredSession, loadStoredSession, normalizeUser, saveLoginEmail, saveStoredSession } from '../../lib/session';
import type { User } from '../../lib/types';

export default function DoctorPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
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

    if (!stored.token || !stored.user) {
      setSessionReady(true);
      return;
    }

    refreshSession()
      .then((session) => {
        const normalized = normalizeUser(session.user);
        setToken(session.accessToken);
        setUser(normalized);
        saveStoredSession(session.accessToken, normalized, stored.rememberEmail, session.user.email);
      })
      .catch(() => {
        clearStoredSession();
        setToken('');
        setUser(null);
      })
      .finally(() => setSessionReady(true));
  }, []);

  useEffect(() => {
    if (!sessionReady || !user) return;
    if (user.role === 'PATIENT') router.replace('/patient');
    if (user.role === 'SUPER_ADMIN') router.replace('/admin');
    if (user.role === 'EMERGENCY_STAFF') router.replace('/emergency');
  }, [router, sessionReady, user]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      const session = await login(email, password);
      const normalized = normalizeUser(session.user);
      saveStoredSession(session.accessToken, normalized, rememberMe, email);
      saveLoginEmail(email, rememberMe);
      setToken(session.accessToken);
      setUser(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearStoredSession();
    setToken('');
    setUser(null);
  }

  if (!sessionReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm font-medium">Opening doctor workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        email={email}
        password={password}
        rememberMe={rememberMe}
        infoMessage={infoMessage}
        error={error}
        loading={loading}
        onEmailChange={(value) => {
          setEmail(value);
          if (rememberMe) saveLoginEmail(value, rememberMe);
        }}
        onPasswordChange={setPassword}
        onRememberChange={(value) => {
          setRememberMe(value);
          saveLoginEmail(email, value);
        }}
        onForgotPassword={() => setInfoMessage('Contact your Helix administrator to reset your password.')}
        onSubmit={handleLogin}
      />
    );
  }

  if (user.role !== 'DOCTOR' && user.role !== 'HOSPITAL_ADMIN') {
    return null;
  }

  return <DoctorDashboard token={token} user={user} onLogout={handleLogout} />;
}
