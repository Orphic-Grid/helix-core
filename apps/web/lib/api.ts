import type { Alert, Patient, User, ConsentRequest, EmergencySession } from './types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000/api/v1');

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

export async function searchPatients(token: string, query: string): Promise<Patient[]> {
  if (!query.trim()) return [];
  return request(`/patients/search?q=${encodeURIComponent(query)}`, { method: 'GET' }, token);
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
    throw new Error(text || response.statusText || `Request failed: ${response.status}`);
  }

  return response.json();
}
