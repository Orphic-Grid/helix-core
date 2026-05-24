'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAlerts, getPatient, logout as logoutRequest } from '../../lib/api';
import { normalizeUser } from '../../lib/session';
import type { Alert, Patient, User } from '../../lib/types';
import Header from './Header';
import PatientWorkspace from './PatientWorkspace';

interface PatientDashboardProps {
  initialUser?: User | null;
  initialToken?: string;
}

export default function PatientDashboard({ initialUser = null, initialToken = '' }: PatientDashboardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser ? normalizeUser(initialUser) : null);
  const [patient, setPatient] = useState<Patient | null>(null);


  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedToken = initialToken || '';
    const normalized = initialUser ? normalizeUser(initialUser) : null;

    if (!storedToken || !normalized || normalized.role !== 'PATIENT' || !normalized.patientId) {
      setLoading(false);
      router.replace('/');
      return;
    }

    setLoading(true);

    Promise.all([
      getPatient(storedToken, normalized.patientId),
      getAlerts(storedToken, normalized.patientId),
    ])
      .then(([patientData, alertData]) => {
        setPatient(patientData);
        setAlerts(alertData);
        setUser(normalized);

      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load your patient portal');
      })
      .finally(() => setLoading(false));
  }, [initialToken, initialUser, router]);



  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // ignore
    }

    window.localStorage.removeItem('helix_token');
    window.localStorage.removeItem('helix_user');
    router.replace('/');
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Loading your patient portal…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-10 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Unable to load patient dashboard</h1>
          <p className="mt-4 text-slate-600">{error}</p>
          <button
            onClick={() => router.replace('/')}
            className="mt-8 inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header user={user} onLogout={handleLogout} liveSyncStatus="synced" alertCount={alerts.length} />
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1600px] px-4 pb-10 pt-6">
        <PatientWorkspace patient={patient} alerts={alerts} />
      </main>
    </div>
  );
}
