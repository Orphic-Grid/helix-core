'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientDashboard from '../components/PatientDashboard';
import { refreshSession } from '../../lib/api';
import type { User, UserRole } from '../../lib/types';

type RawUserData = User | ({ name?: string } & Record<string, unknown>);

function normalizeUser(raw: RawUserData): User {
  const role = typeof raw.role === 'string' ? (raw.role.toUpperCase() as UserRole) : raw.role;
  return {
    ...raw,
    role,
    patientId: raw.patientId ?? null,
    fullName:
      raw.fullName ??
      ('name' in raw && typeof raw.name === 'string' ? raw.name : undefined) ??
      raw.email,
  } as User;
}

export default function PatientPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const storedToken = window.localStorage.getItem('helix_token');
    const storedUser = window.localStorage.getItem('helix_user');

    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        setUser(normalizeUser(JSON.parse(storedUser) as User & { name?: string }));
      } catch {
        // ignore invalid stored user
      }
    }

    if (!storedToken) {
      setSessionReady(true);
      return;
    }

    refreshSession()
      .then((session) => {
        const normalized = normalizeUser(session.user);
        setUser(normalized);
        setToken(session.accessToken);
        window.localStorage.setItem('helix_token', session.accessToken);
        window.localStorage.setItem('helix_user', JSON.stringify(normalized));
      })
      .catch(() => {
        setUser(null);
        setToken('');
      })
      .finally(() => {
        setSessionReady(true);
      });
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    if (!user || user.role !== 'PATIENT' || !user.patientId) {
      router.replace('/');
    }
  }, [user, sessionReady, router]);

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

  return user && user.role === 'PATIENT' && token ? (
    <PatientDashboard initialUser={user} initialToken={token} />
  ) : null;
}
