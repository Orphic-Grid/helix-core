'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { UserRole } from '../../lib/types';
import { useAuth } from './SessionProvider';

const routeMap: Record<UserRole, string> = {
  SUPER_ADMIN: '/admin',
  HOSPITAL_ADMIN: '/hospital',
  DOCTOR: '/doctor',
  EMERGENCY_STAFF: '/emergency',
  PATIENT: '/patient',
};

const allowedRolesByRoute: Record<string, UserRole[]> = {
  '/admin': ['SUPER_ADMIN'],
  '/hospital': ['HOSPITAL_ADMIN'],
  '/doctor': ['DOCTOR', 'HOSPITAL_ADMIN'],
  '/emergency': ['DOCTOR', 'EMERGENCY_STAFF', 'HOSPITAL_ADMIN'],
  '/patient': ['PATIENT'],
};

export default function RouteGate({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== 'authenticated' || !user) return;

    const allowed = allowedRolesByRoute[pathname] ?? null;
    if (allowed && !allowed.includes(user.role)) {
      const home = routeMap[user.role];
      if (home && home !== pathname) router.replace(home);
      return;
    }

    // If user is authenticated but is on a non-home route, normalize to home route.
    if (pathname === '/' || pathname === '/patient' || pathname === '/doctor' || pathname === '/hospital' || pathname === '/emergency' || pathname === '/admin') {
      const home = routeMap[user.role];
      if (home && home !== pathname) router.replace(home);
    }
  }, [status, user, router, pathname]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Validating session…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

