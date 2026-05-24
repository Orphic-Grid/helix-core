'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientDashboard from '../components/PatientDashboard';
import LoginPage from '../components/LoginPage';
import { login, refreshSession } from '../../lib/api';
import { loadStoredSession, normalizeUser, saveLoginEmail, saveStoredSession, clearStoredSession } from '../../lib/session';
import type { User } from '../../lib/types';

export default function PatientPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [email, setEmail] = useState('rahul@helix.local');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

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
        setUser(normalized);
        setToken(session.accessToken);
        saveStoredSession(session.accessToken, normalized, stored.rememberEmail, stored.email || normalized.email);
      })
      .catch(() => {
        clearStoredSession();
        setUser(null);
        setToken('');
      })
      .finally(() => setSessionReady(true));
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    if (user && user.role !== 'PATIENT') {
      const destination = user.role === 'DOCTOR' ? '/doctor' : user.role === 'SUPER_ADMIN' ? '/admin' : user.role === 'HOSPITAL_ADMIN' ? '/hospital' : '/';
      router.replace(destination);
    }
  }, [sessionReady, user, router]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const session = await login(email, password);
      const normalized = normalizeUser(session.user);
      if (normalized.role !== 'PATIENT' || !normalized.patientId) {
        setError('Please sign in with a patient account to access the patient portal.');
        return;
      }
      setToken(session.accessToken);
      setUser(normalized);
      saveStoredSession(session.accessToken, normalized, rememberMe, email);
      saveLoginEmail(email, rememberMe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    setInfoMessage('Contact your Helix administrator to reset your password.');
  }

  if (!sessionReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Loading your patient portal…</p>
        </div>
      </div>
    );
  }

  if (user && user.role === 'PATIENT' && token) {
    return <PatientDashboard initialUser={user} initialToken={token} />;
  }

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
      onForgotPassword={handleForgotPassword}
      onSubmit={handleLogin}
    />
  );
}
