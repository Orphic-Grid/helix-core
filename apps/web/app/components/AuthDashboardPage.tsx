'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  Lock,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  createPatient,
  createUser,
  getActiveSessions,
  getAuditLogs,
  getHospitalOverview,
  getHospitals,
  getRecentPatients,
  getUsers,
  login,
  logout,
  refreshSession,
  setUserStatus,
} from '../../lib/api';
import { loadStoredSession, normalizeUser, saveLoginEmail, saveStoredSession, clearStoredSession } from '../../lib/session';
import type { AuditLog, Hospital, ManagedUser, Patient, User, UserRole } from '../../lib/types';
import LoginPage from './LoginPage';

const roleHome: Record<UserRole, string> = {
  SUPER_ADMIN: '/admin',
  HOSPITAL_ADMIN: '/hospital',
  DOCTOR: '/doctor',
  EMERGENCY_STAFF: '/emergency',
  PATIENT: '/doctor',
};

const allowedRoles: Record<string, UserRole[]> = {
  '/admin': ['SUPER_ADMIN'],
  '/hospital': ['HOSPITAL_ADMIN'],
  '/doctor': ['DOCTOR', 'HOSPITAL_ADMIN'],
  '/emergency': ['DOCTOR', 'EMERGENCY_STAFF', 'HOSPITAL_ADMIN'],
};

type Props = {
  route: '/admin' | '/hospital' | '/doctor' | '/emergency';
};

export default function AuthDashboardPage({ route }: Props) {
  const [token, setToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState(defaultEmail(route));
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [infoMessage, setInfoMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([]);
  const [overview, setOverview] = useState<Record<string, number>>({});
  const [actionMessage, setActionMessage] = useState('');
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    password: 'password123',
    role: 'DOCTOR' as UserRole,
    hospitalId: '',
    department: '',
  });
  const [patientForm, setPatientForm] = useState({
    name: '',
    govtId: '',
    abhaId: '',
    age: '40',
    gender: 'Female',
    phone: '',
    bloodGroup: 'O+',
    chronicConditions: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    providerId: '',
    doctorName: '',
    department: '',
    externalPatientId: '',
    intakeNote: '',
  });

  const routeAllowed = useMemo(() => user && allowedRoles[route].includes(user.role), [route, user]);
  const canManage = route === '/admin' || route === '/hospital';

  const router = useRouter();

  useEffect(() => {
    const stored = loadStoredSession();
    if (stored.token) setToken(stored.token);
    if (stored.user) setUser(stored.user);
    if (stored.email) setEmail(stored.email);
    setRememberMe(stored.rememberEmail);
    setSessionReady(true);

    if (stored.token) {
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
        });
    }
  }, []);

  useEffect(() => {
    if (!sessionReady || !user) return;
    if (!routeAllowed) {
      const homeRoute = roleHome[user.role];
      if (homeRoute && homeRoute !== route) {
        router.replace(homeRoute);
      }
    }
  }, [route, routeAllowed, router, sessionReady, user]);

  useEffect(() => {
    if (!token || !user || !allowedRoles[route].includes(user.role)) return;
    loadAdminData();
  }, [route, token, user]);

  useEffect(() => {
    if (!hospitals[0]) return;
    setUserForm((current) => ({ ...current, hospitalId: current.hospitalId || hospitals[0].id }));
    setPatientForm((current) => ({ ...current, providerId: current.providerId || hospitals[0].id }));
  }, [hospitals]);

  async function loadAdminData() {
    if (!token || !user) return;
    await Promise.allSettled([
      getAuditLogs(token).then(setAuditLogs),
      getHospitals(token).then(setHospitals),
      getUsers(token).then(setManagedUsers),
      getRecentPatients(token).then(setRecentPatients),
      getActiveSessions(token).then(setSessions),
      user.role === 'SUPER_ADMIN' ? getHospitalOverview(token).then(setOverview) : Promise.resolve(),
    ]);
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      const session = await login(email, password);
      const normalized = normalizeUser(session.user);
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

  async function handleLogout() {
    try {
      await logout();
    } catch {}
    clearStoredSession();
    setToken('');
    setUser(null);
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setActionMessage('');
    try {
      await createUser(token, {
        ...userForm,
        hospitalId: userForm.role === 'SUPER_ADMIN' ? undefined : userForm.hospitalId,
      });
      setActionMessage('Login approved and account is active.');
      setUserForm((current) => ({ ...current, fullName: '', email: '', department: '' }));
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User approval failed');
    }
  }

  async function handleCreatePatient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setActionMessage('');
    try {
      await createPatient(token, {
        ...patientForm,
        age: Number(patientForm.age),
        chronicConditions: splitList(patientForm.chronicConditions),
        allergies: splitList(patientForm.allergies),
      });
      setActionMessage('Patient created, linked to provider, and approved for access.');
      setPatientForm((current) => ({
        ...current,
        name: '',
        govtId: '',
        abhaId: '',
        phone: '',
        chronicConditions: '',
        allergies: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        doctorName: '',
        department: '',
        externalPatientId: '',
        intakeNote: '',
      }));
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Patient approval failed');
    }
  }

  async function toggleUserStatus(item: ManagedUser) {
    setError('');
    try {
      await setUserStatus(token, item.id, !item.is_active);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update user status');
    }
  }

  if (!sessionReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Initializing workspace…</p>
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

  if (!routeAllowed) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="mx-auto max-w-3xl rounded-lg border border-red-400/30 bg-red-950/30 p-6">
          <div className="flex items-center gap-3">
            <Lock className="text-red-300" size={22} />
            <div>
              <h1 className="text-xl font-semibold">Unauthorized clinical workspace</h1>
              <p className="mt-1 text-sm text-red-100/80">
                {user.role.replaceAll('_', ' ')} cannot access {route}. Assigned workspace: {roleHome[user.role]}.
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-6 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950">
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="border-b border-white/10 bg-slate-950/80 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20 text-teal-200">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">Helix Core Identity Command</p>
              <p className="text-xs text-slate-400">
                {user.fullName} / {user.role.replaceAll('_', ' ')}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">
            Sign out
          </button>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-6">
        <DashboardHero route={route} />

        {(error || actionMessage) && (
          <div className={`mt-4 rounded-md border px-4 py-3 text-sm ${error ? 'border-red-400/30 bg-red-950/35 text-red-100' : 'border-emerald-400/30 bg-emerald-950/35 text-emerald-100'}`}>
            {error || actionMessage}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Metric icon={Building2} label="Hospitals" value={String(overview.hospitals ?? hospitals.length)} />
          <Metric icon={Users} label="Active users" value={String(overview.active_users ?? managedUsers.filter((item) => item.is_active).length)} />
          <Metric icon={ShieldCheck} label="Live sessions" value={String(overview.active_sessions ?? sessions.length)} />
          <Metric icon={AlertTriangle} label="Emergency overrides" value={String(overview.emergency_overrides_24h ?? auditLogs.filter((log) => log.emergency_override).length)} />
        </div>

        {canManage && (
          <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Panel title="Approve Login Access" icon={UserPlus}>
              <form onSubmit={handleCreateUser} className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Full name" value={userForm.fullName} onChange={(value) => setUserForm((current) => ({ ...current, fullName: value }))} required />
                  <Input label="Email" value={userForm.email} onChange={(value) => setUserForm((current) => ({ ...current, email: value }))} type="email" required />
                  <Select label="Role" value={userForm.role} onChange={(value) => setUserForm((current) => ({ ...current, role: value as UserRole }))}>
                    {(user.role === 'SUPER_ADMIN' ? ['HOSPITAL_ADMIN', 'DOCTOR', 'EMERGENCY_STAFF', 'PATIENT', 'SUPER_ADMIN'] : ['DOCTOR', 'EMERGENCY_STAFF', 'PATIENT']).map((role) => (
                      <option key={role} value={role}>{role.replaceAll('_', ' ')}</option>
                    ))}
                  </Select>
                  <Select label="Hospital / Provider" value={userForm.hospitalId} onChange={(value) => setUserForm((current) => ({ ...current, hospitalId: value }))} disabled={userForm.role === 'SUPER_ADMIN'}>
                    {hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                    ))}
                  </Select>
                  <Input label="Department" value={userForm.department} onChange={(value) => setUserForm((current) => ({ ...current, department: value }))} />
                  <Input label="Temporary password" value={userForm.password} onChange={(value) => setUserForm((current) => ({ ...current, password: value }))} required />
                </div>
                <button className="inline-flex w-fit items-center gap-2 rounded-md bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200">
                  <CheckCircle2 size={16} /> Approve login
                </button>
              </form>
            </Panel>

            <Panel title="Approve Patient Record" icon={FilePlus2}>
              <form onSubmit={handleCreatePatient} className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input label="Patient name" value={patientForm.name} onChange={(value) => setPatientForm((current) => ({ ...current, name: value }))} required />
                  <Input label="Govt ID" value={patientForm.govtId} onChange={(value) => setPatientForm((current) => ({ ...current, govtId: value }))} required />
                  <Input label="ABHA ID" value={patientForm.abhaId} onChange={(value) => setPatientForm((current) => ({ ...current, abhaId: value }))} />
                  <Input label="Age" value={patientForm.age} onChange={(value) => setPatientForm((current) => ({ ...current, age: value }))} type="number" required />
                  <Select label="Gender" value={patientForm.gender} onChange={(value) => setPatientForm((current) => ({ ...current, gender: value }))}>
                    {['Female', 'Male', 'Non-binary', 'Other'].map((item) => <option key={item}>{item}</option>)}
                  </Select>
                  <Input label="Phone" value={patientForm.phone} onChange={(value) => setPatientForm((current) => ({ ...current, phone: value }))} required />
                  <Input label="Blood group" value={patientForm.bloodGroup} onChange={(value) => setPatientForm((current) => ({ ...current, bloodGroup: value }))} required />
                  <Select label="Approved provider" value={patientForm.providerId} onChange={(value) => setPatientForm((current) => ({ ...current, providerId: value }))}>
                    {hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                    ))}
                  </Select>
                  <Input label="External patient ID" value={patientForm.externalPatientId} onChange={(value) => setPatientForm((current) => ({ ...current, externalPatientId: value }))} />
                  <Input label="Doctor" value={patientForm.doctorName} onChange={(value) => setPatientForm((current) => ({ ...current, doctorName: value }))} />
                  <Input label="Department" value={patientForm.department} onChange={(value) => setPatientForm((current) => ({ ...current, department: value }))} />
                  <Input label="Emergency contact" value={patientForm.emergencyContactPhone} onChange={(value) => setPatientForm((current) => ({ ...current, emergencyContactPhone: value }))} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Chronic conditions" value={patientForm.chronicConditions} onChange={(value) => setPatientForm((current) => ({ ...current, chronicConditions: value }))} placeholder="Diabetes, Hypertension" />
                  <Input label="Allergies" value={patientForm.allergies} onChange={(value) => setPatientForm((current) => ({ ...current, allergies: value }))} placeholder="Penicillin, Pollen" />
                </div>
                <label className="grid gap-1 text-xs font-medium text-slate-300">
                  Intake note
                  <textarea
                    value={patientForm.intakeNote}
                    onChange={(event) => setPatientForm((current) => ({ ...current, intakeNote: event.target.value }))}
                    className="min-h-20 rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-teal-300/70"
                    placeholder="Why this record is being created and who should act on it"
                  />
                </label>
                <button className="inline-flex w-fit items-center gap-2 rounded-md bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200">
                  <CheckCircle2 size={16} /> Create and approve
                </button>
              </form>
            </Panel>
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Panel title={route === '/hospital' ? 'Doctor Management' : 'Identity Directory'}>
            <div className="space-y-2">
              {managedUsers.slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <div>
                    <p className="text-sm font-medium">{item.full_name}</p>
                    <p className="text-xs text-slate-400">{item.email} / {item.department ?? 'No department'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-teal-400/10 px-2 py-1 text-xs text-teal-100">{item.role.replaceAll('_', ' ')}</span>
                    <button onClick={() => toggleUserStatus(item)} className={`rounded px-2 py-1 text-xs ${item.is_active ? 'bg-white/10 text-slate-200' : 'bg-red-400/15 text-red-100'}`}>
                      {item.is_active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Audit Monitoring">
            <div className="space-y-2">
              {auditLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{log.action.replaceAll('.', ' ')}</p>
                    {log.emergency_override && <span className="rounded bg-red-400/15 px-2 py-1 text-xs text-red-100">Emergency</span>}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {log.user_name ?? 'System'} / {log.hospital_name ?? 'Platform'} / {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title="Recently Approved Patients" icon={FilePlus2}>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {recentPatients.slice(0, 6).map((patient) => (
                <div key={patient.id} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{patient.name}</p>
                    <span className="rounded bg-white/10 px-2 py-1 text-xs text-slate-200">{patient.id}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{patient.govt_id} / {patient.phone} / {patient.blood_group}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}

function DashboardHero({ route }: Props) {
  const copy = {
    '/admin': ['SUPER ADMIN DASHBOARD', 'Platform security, hospital overview, patient approval, provider access, and audit surveillance.'],
    '/hospital': ['HOSPITAL ADMIN DASHBOARD', 'Doctor login approvals, patient onboarding, department visibility, and access monitoring.'],
    '/doctor': ['DOCTOR DASHBOARD', 'Clinical search, patient timelines, intelligence alerts, emergency access, and notes.'],
    '/emergency': ['EMERGENCY WORKSPACE', 'Temporary elevated access for trauma workflows with reason capture and audit review.'],
  }[route];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-center gap-3 text-teal-200">
        <Stethoscope size={18} />
        <p className="text-xs font-semibold tracking-widest">{copy[0]}</p>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Healthcare access command center</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-300">{copy[1]}</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <Icon className="text-teal-200" size={18} />
      <p className="mt-4 text-2xl font-semibold">{value}</p>
      <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  );
}

function Panel({ title, children, icon: Icon = ClipboardList }: { title: string; children: React.ReactNode; icon?: typeof Activity }) {
  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/35 p-4">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={16} className="text-teal-200" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-300">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-teal-300/70"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-300">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-teal-300/70 disabled:opacity-50"
      >
        {children}
      </select>
    </label>
  );
}

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function defaultEmail(route: Props['route']) {
  if (route === '/admin') return 'superadmin@helix.local';
  if (route === '/hospital') return 'admin@helix.local';
  if (route === '/emergency') return 'emergency@helix.local';
  return 'doctor@helix.local';
}
