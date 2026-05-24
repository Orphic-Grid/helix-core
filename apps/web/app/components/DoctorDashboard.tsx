'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Search, UserRound } from 'lucide-react';
import { getAlerts, getPatient, getRecentPatients, logout as logoutRequest, searchPatients } from '../../lib/api';
import type { Alert, Patient, User } from '../../lib/types';
import Header from './Header';
import PatientWorkspace from './PatientWorkspace';

type DoctorDashboardProps = {
  token: string;
  user: User;
  onLogout?: () => void;
};

export default function DoctorDashboard({ token, user, onLogout }: DoctorDashboardProps) {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [error, setError] = useState('');

  const normalizedQuery = query.trim();

  useEffect(() => {
    let cancelled = false;

    async function loadPatients() {
      setLoadingList(true);
      setError('');
      try {
        const data = normalizedQuery
          ? await searchPatients(token, normalizedQuery)
          : user.role === 'HOSPITAL_ADMIN'
          ? await getRecentPatients(token)
          : [];
        if (!cancelled) setPatients(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load patients');
          setPatients([]);
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    }

    const timer = window.setTimeout(loadPatients, normalizedQuery ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedQuery, token, user.role]);

  async function openPatient(id: string) {
    setLoadingRecord(true);
    setError('');
    try {
      const [patient, patientAlerts] = await Promise.all([
        getPatient(token, id),
        getAlerts(token, id),
      ]);
      setSelectedPatient(patient);
      setAlerts(patientAlerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open patient record');
    } finally {
      setLoadingRecord(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // session storage is still cleared by the parent route.
    }
    onLogout?.();
  }

  const activePatientId = selectedPatient?.id ?? null;
  const resultLabel = useMemo(() => {
    if (loadingList) return 'Loading patient index';
    if (normalizedQuery) return `${patients.length} matching record${patients.length === 1 ? '' : 's'}`;
    return user.role === 'HOSPITAL_ADMIN' ? 'Available patient records' : 'Search patients by name or patient ID';
  }, [loadingList, normalizedQuery, patients.length, user.role]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header user={user} onLogout={handleLogout} liveSyncStatus="synced" alertCount={alerts.length} />

      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[360px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Doctor workspace</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-950">Patient access</h1>
            <p className="mt-1 text-sm text-slate-500">Search by patient name or patient ID, then open the connected clinical record.</p>

            <label className="mt-5 block">
              <span className="sr-only">Search patient by name or patient ID</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name or patient ID"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{resultLabel}</p>
          </div>

          {error && (
            <div className="m-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="max-h-[calc(100vh-15rem)] overflow-y-auto p-3">
            {loadingList ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : patients.length ? (
              <div className="space-y-2">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => openPatient(patient.id)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      activePatientId === patient.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                        {(patient.name ?? patient.id).split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-950">{patient.name ?? 'Unnamed patient'}</p>
                        <p className="mt-1 text-xs text-slate-500">Patient ID: {patient.id}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {patient.age}y / {patient.gender} / {patient.blood_group || 'Blood group unknown'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <UserRound className="mx-auto text-slate-300" size={32} />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  {normalizedQuery ? 'No patient records found' : 'Enter a patient name or ID to begin searching.'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {normalizedQuery ? 'Try a different patient name or internal patient ID.' : 'Doctors can search live patient records by name or ID.'}
                </p>
              </div>
            )}
          </div>
        </aside>

        <main className="min-w-0 bg-slate-50">
          {loadingRecord ? (
            <div className="flex h-full min-h-[420px] items-center justify-center">
              <div className="text-center text-slate-600">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                <p className="text-sm font-medium">Opening connected patient workspace...</p>
              </div>
            </div>
          ) : selectedPatient ? (
            <PatientWorkspace patient={selectedPatient} alerts={alerts} />
          ) : (
            <div className="flex h-full min-h-[520px] items-center justify-center px-6">
              <div className="max-w-xl text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Search size={24} />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-slate-950">Search, select, treat</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Select one of the existing patient records to open timeline, diagnoses, medications, reports,
                  allergies, emergency information, vitals, visit history, and risk alerts in one workspace.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
