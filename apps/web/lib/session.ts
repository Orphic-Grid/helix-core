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
      (raw as { full_name?: unknown }).full_name?.toString() ??
      (raw as { fullName?: unknown }).fullName?.toString() ??
      (typeof (raw as { name?: unknown }).name === 'string' ? String((raw as { name?: unknown }).name) : undefined) ??
      String(raw.email),
    role: normalizeRole((raw as { role?: unknown }).role),
    hospitalId:
      (raw as { hospitalId?: string | null }).hospitalId ??
      (raw as { hospital_id?: string | null }).hospital_id ??
      null,
    department:
      (raw as { department?: string | null }).department ??
      null,
    patientId:
      (raw as { patientId?: string | null }).patientId ??
      (raw as { patient_id?: string | null }).patient_id ??
      null,
    permissions: {
      can_view_patient: Boolean((raw as { permissions?: { can_view_patient?: unknown } }).permissions?.can_view_patient),
      can_manage_users: Boolean((raw as { permissions?: { can_manage_users?: unknown } }).permissions?.can_manage_users),
      can_use_emergency_mode: Boolean((raw as { permissions?: { can_use_emergency_mode?: unknown } }).permissions?.can_use_emergency_mode),
      can_export_data: Boolean((raw as { permissions?: { can_export_data?: unknown } }).permissions?.can_export_data),
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
