'use client';

import { useEffect, useState } from 'react';
import {
  getAlerts,
  getPatient,
  login,
  logout as logoutRequest,
  refreshSession,
  searchPatients,
  requestEmergencyAccess,
} from '../lib/api';
import type { Alert, Patient, User } from '../lib/types';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import PatientSidebar from './components/PatientSidebar';
import PatientWorkspace from './components/PatientWorkspace';
import { Database, TrendingUp, Brain } from 'lucide-react';

export default function Home() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [email, setEmail] = useState('doctor@helix.local');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showEmergencyMode, setShowEmergencyMode] = useState(false);
  const [liveSyncStatus, setLiveSyncStatus] = useState<'syncing' | 'synced' | 'error'>('synced');

  /* ── Bootstrap session ───────────────────────── */
  useEffect(() => {
    const storedToken = window.localStorage.getItem('helix_token');
    const storedUser = window.localStorage.getItem('helix_user');
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
    refreshSession()
      .then((session) => {
        setToken(session.accessToken);
        setUser(session.user);
        window.localStorage.setItem('helix_token', session.accessToken);
        window.localStorage.setItem('helix_user', JSON.stringify(session.user));
      })
      .catch(() => {});
  }, []);

  /* ── Debounced search ────────────────────────── */
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!token || !query.trim()) {
        setResults([]);
        return;
      }
      setSearchLoading(true);
      setLiveSyncStatus('syncing');
      try {
        const result = await searchPatients(token, query);
        setResults(result);
        setLiveSyncStatus('synced');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setLiveSyncStatus('error');
      } finally {
        setSearchLoading(false);
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query, token]);

  /* ── Live sync pulse ─────────────────────────── */
  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(() => {
      setLiveSyncStatus('syncing');
      setTimeout(() => setLiveSyncStatus('synced'), 1200);
    }, 30_000);
    return () => clearInterval(interval);
  }, [selected]);

  /* ── Handlers ────────────────────────────────── */
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setAuthLoading(true);
    try {
      const session = await login(email, password);
      setToken(session.accessToken);
      setUser(session.user);
      window.localStorage.setItem('helix_token', session.accessToken);
      window.localStorage.setItem('helix_user', JSON.stringify(session.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  }

  async function selectPatient(id: string) {
    setError('');
    setRecordLoading(true);
    setLiveSyncStatus('syncing');
    try {
      const [profile, riskAlerts] = await Promise.all([
        getPatient(token, id),
        getAlerts(token, id),
      ]);
      setSelected(profile);
      setAlerts(riskAlerts);
      setLiveSyncStatus('synced');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load patient');
      setLiveSyncStatus('error');
    } finally {
      setRecordLoading(false);
    }
  }

  async function handleEmergencyAccess(patientId: string) {
    if (
      !window.confirm(
        'Activate emergency access? This will unlock all records for 6 hours and is fully audited.',
      )
    )
      return;
    try {
      const response = await requestEmergencyAccess(
        token,
        patientId,
        'unknown',
        'red',
        'Emergency department admission — patient unconscious',
      );
      if (response.success) setSelected(response.patient);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Emergency access failed');
    }
  }

  async function handleLogout() {
    try { await logoutRequest(); } catch {}
    window.localStorage.removeItem('helix_token');
    window.localStorage.removeItem('helix_user');
    setToken('');
    setUser(null);
    setSelected(null);
    setAlerts([]);
    setResults([]);
  }

  /* ── Render ──────────────────────────────────── */
  if (!user) {
    return (
      <LoginPage
        email={email}
        password={password}
        error={error}
        loading={authLoading}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <PatientSidebar
        query={query}
        onQueryChange={setQuery}
        results={results}
        loading={searchLoading}
        onSelectPatient={selectPatient}
        selectedPatientId={selected?.id ?? null}
        emergencyMode={showEmergencyMode}
        onToggleEmergency={() => setShowEmergencyMode((v) => !v)}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          user={user}
          onLogout={handleLogout}
          liveSyncStatus={liveSyncStatus}
          alertCount={alerts.filter((a) => a.severity === 'critical').length}
        />

        <main className="flex-1 overflow-hidden">
          {recordLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-9 w-9 rounded-full border-[3px] border-brand-500 border-t-transparent animate-spin mb-4" />
                <p className="text-sm font-medium text-slate-500">Loading patient records…</p>
              </div>
            </div>
          ) : selected ? (
            <PatientWorkspace
              key={selected.id}
              patient={selected}
              alerts={alerts}
              onEmergencyAccess={handleEmergencyAccess}
              emergencyMode={showEmergencyMode}
            />
          ) : (
            <EmptyDashboard />
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center max-w-sm animate-fade-in">
        {/* Icon */}
        <div className="mx-auto h-20 w-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-card border border-slate-200">
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
            <rect x="15" y="2" width="8" height="34" rx="4" fill="#007A74" fillOpacity="0.75" />
            <rect x="2" y="15" width="34" height="8" rx="4" fill="#007A74" fillOpacity="0.75" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">Select a Patient</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Search by name, ABHA ID, or phone number to view unified longitudinal records across all
          connected healthcare providers.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Database, label: 'Multi-Provider', sub: 'Unified records', color: 'text-brand-500' },
            { icon: TrendingUp, label: 'Longitudinal', sub: 'Full history', color: 'text-blue-500' },
            { icon: Brain, label: 'AI Insights', sub: 'Clinical AI', color: 'text-purple-500' },
          ].map(({ icon: Icon, label, sub, color }) => (
            <div key={label} className="p-4 bg-white rounded-xl border border-slate-200 shadow-card">
              <Icon size={20} className={`mx-auto mb-2 ${color}`} />
              <p className="text-xs font-semibold text-slate-700">{label}</p>
              <p className="text-xxs text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
