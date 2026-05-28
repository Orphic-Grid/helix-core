import type {
  Alert,
  Patient,
  User,
  ConsentRequest,
  EmergencySession,
  AuditLog,
  Hospital,
  ManagedUser,
  CreateManagedUserInput,
  CreatePatientInput,
} from './types';

function getApiUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!configured) {
    return '/api/v1';
  }

  try {
    const url = new URL(configured);
    if (url.pathname === '/') {
      url.pathname = '/api/v1';
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    // Relative paths like /api/v1 are valid here.
  }

  return configured;
}

const API_URL = getApiUrl();

export async function login(email: string, password: string): Promise<{ accessToken: string; user: User }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshSession(): Promise<{ accessToken: string; user: User }> {
  return request('/auth/refresh', { method: 'POST' });
}

export async function logout(): Promise<{ success: boolean }> {
  return request('/auth/logout', { method: 'POST' });
}

export async function getAuditLogs(token: string): Promise<AuditLog[]> {
  return request('/audit-logs', { method: 'GET' }, token);
}

export async function getHospitals(token: string): Promise<Hospital[]> {
  return request('/hospitals', { method: 'GET' }, token);
}

export async function getHospitalOverview(token: string): Promise<Record<string, number>> {
  return request('/hospitals/overview', { method: 'GET' }, token);
}

export async function getUsers(token: string): Promise<ManagedUser[]> {
  return request('/users', { method: 'GET' }, token);
}

export async function createUser(token: string, input: CreateManagedUserInput): Promise<ManagedUser> {
  return request('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  }, token);
}

export async function setUserStatus(token: string, id: string, isActive: boolean): Promise<ManagedUser> {
  return request(`/users/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  }, token);
}

export async function getActiveSessions(token: string): Promise<Record<string, unknown>[]> {
  return request('/users/sessions', { method: 'GET' }, token);
}

export async function searchPatients(token: string, query: string): Promise<Patient[]> {
  if (!query.trim()) return [];
  return request(`/patients/search?q=${encodeURIComponent(query)}`, { method: 'GET' }, token);
}

export async function getRecentPatients(token: string): Promise<Patient[]> {
  return request('/patients/recent/onboarded', { method: 'GET' }, token);
}

export async function createPatient(token: string, input: CreatePatientInput): Promise<Patient> {
  return request('/patients', {
    method: 'POST',
    body: JSON.stringify(input),
  }, token);
}

export async function getPatient(token: string, id: string): Promise<Patient> {
  return request(`/patients/${encodeURIComponent(id)}`, { method: 'GET' }, token);
}

export async function getAlerts(token: string, id: string): Promise<Alert[]> {
  return request(`/patients/${encodeURIComponent(id)}/alerts`, { method: 'GET' }, token);
}

export async function requestConsent(
  token: string, 
  patientId: string, 
  providerId: string, 
  purpose: string, 
  durationHours?: number
): Promise<{ success: boolean; consentRequest: ConsentRequest; message: string }> {
  return request(`/patients/${encodeURIComponent(patientId)}/consent/request`, {
    method: 'POST',
    body: JSON.stringify({ providerId, purpose, durationHours }),
  }, token);
}

export async function requestEmergencyAccess(
  token: string,
  patientId: string,
  emergencyType: string,
  triageLevel: string,
  accessReason?: string
): Promise<{ success: boolean; emergencySession: EmergencySession; patient: Patient; message: string }> {
  return request(`/patients/${encodeURIComponent(patientId)}/emergency/access`, {
    method: 'POST',
    body: JSON.stringify({ emergencyType, triageLevel, accessReason }),
  }, token);
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    let message = response.statusText || `Request failed: ${response.status}`;

    const parseJson = (value: string) => {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    const body = parseJson(text);
    if (body && typeof body === 'object') {
      message = body.message || body.error || message;
    } else if (typeof body === 'string') {
      message = body;
    } else if (text) {
      message = text;
    }

    if (response.status === 401) {
      message = path === '/auth/login' ? 'Invalid email or password' : 'Unauthorized request';
    }

    throw new Error(message);
  }

  return response.json();
}
