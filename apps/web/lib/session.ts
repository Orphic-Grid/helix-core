import type { User, UserRole } from './types';

type RawUserData = User | ({ name?: string } & Record<string, unknown>);

const STORAGE_TOKEN = 'helix_token';
const STORAGE_USER = 'helix_user';
const STORAGE_EMAIL = 'helix_email';
const STORAGE_REMEMBER = 'helix_remember';

function normalizeRole(role: unknown): UserRole {
  if (typeof role !== 'string') {
    return 'DOCTOR';
  }

  const normalized = role.toUpperCase();
  if (['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'EMERGENCY_STAFF', 'PATIENT'].includes(normalized)) {
    return normalized as UserRole;
  }

  return 'DOCTOR';
}

export function normalizeUser(raw: RawUserData): User {
  return {
    id: String(raw.id),
    email: String(raw.email),
    fullName:
      (raw as any).fullName ??
      (typeof (raw as any).name === 'string' ? (raw as any).name : undefined) ??
      String(raw.email),
    role: normalizeRole((raw as any).role),
    hospitalId: (raw as any).hospitalId ?? null,
    department: (raw as any).department ?? null,
    patientId: (raw as any).patientId ?? null,
    permissions: {
      can_view_patient: Boolean((raw as any).permissions?.can_view_patient),
      can_manage_users: Boolean((raw as any).permissions?.can_manage_users),
      can_use_emergency_mode: Boolean((raw as any).permissions?.can_use_emergency_mode),
      can_export_data: Boolean((raw as any).permissions?.can_export_data),
    },
  };
}

export function loadStoredSession(): { token: string; user: User | null; email: string; rememberEmail: boolean } {
  const storedToken = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_TOKEN) : null;
  const storedUser = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_USER) : null;
  const storedEmail = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_EMAIL) : null;
  const storedRemember = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_REMEMBER) : null;

  const token = storedToken ?? '';
  const user = storedUser ? normalizeUser(JSON.parse(storedUser) as RawUserData) : null;
  const email = storedEmail ?? '';
  const rememberEmail = storedRemember === 'true';

  return { token, user, email, rememberEmail };
}

export function saveStoredSession(token: string, user: User, rememberEmail: boolean, email: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_TOKEN, token);
  window.localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  window.localStorage.setItem(STORAGE_REMEMBER, rememberEmail ? 'true' : 'false');
  if (rememberEmail) {
    window.localStorage.setItem(STORAGE_EMAIL, email);
  } else {
    window.localStorage.removeItem(STORAGE_EMAIL);
  }
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_TOKEN);
  window.localStorage.removeItem(STORAGE_USER);
  window.localStorage.removeItem(STORAGE_REMEMBER);
}

export function saveLoginEmail(email: string, rememberEmail: boolean): void {
  if (typeof window === 'undefined') return;
  if (rememberEmail) {
    window.localStorage.setItem(STORAGE_EMAIL, email);
  } else {
    window.localStorage.removeItem(STORAGE_EMAIL);
  }
}
