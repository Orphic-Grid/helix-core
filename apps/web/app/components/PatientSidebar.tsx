'use client';

import { ChevronRight, Search, UserRound, Lock, Eye } from 'lucide-react';
import type { Patient } from '../../lib/types';

interface PatientSidebarProps {
  query: string;
  onQueryChange: (q: string) => void;
  results: Patient[];
  loading: boolean;
  onSelectPatient: (id: string) => void;
  selectedPatientId: string | null;
  emergencyMode: boolean;
  onToggleEmergency: () => void;
}

export default function PatientSidebar({
  query,
  onQueryChange,
  results,
  loading,
  onSelectPatient,
  selectedPatientId,
  emergencyMode,
  onToggleEmergency,
}: PatientSidebarProps) {
  return (
    <aside
      className="w-72 flex flex-col shrink-0 transition-colors duration-300"
      style={{ background: emergencyMode ? '#1A0A0A' : '#0A1628' }}
    >
      {/* Header / search */}
      <div
        className="px-5 pt-5 pb-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-xxs font-bold uppercase tracking-widest text-slate-500 mb-3">
          Patient Intelligence
        </p>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
            size={14}
          />
          <input
            className="w-full pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 rounded-xl border transition focus:outline-none focus:ring-1 focus:ring-brand-400"
            style={{
              background: 'rgba(255,255,255,0.06)',
              borderColor: 'rgba(255,255,255,0.09)',
            }}
            placeholder="Name, ABHA ID, phone…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
      </div>

      {/* Patient list */}
      <div className="flex-1 overflow-y-auto py-3 px-3 scrollbar-dark">
        {loading ? (
          <div className="space-y-2 px-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-0.5 animate-slide-in-left">
            {results.map((patient) => {
              const isSelected = selectedPatientId === patient.id;
              const initials = (patient.name ?? patient.id)
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <button
                  key={patient.id}
                  onClick={() => onSelectPatient(patient.id)}
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all group border ${
                    isSelected
                      ? 'border-brand-500/30 '
                      : 'border-transparent hover:border-white/5'
                  }`}
                  style={{
                    background: isSelected
                      ? 'rgba(0,122,116,0.18)'
                      : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLButtonElement).style.background = '';
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-brand-500 text-white'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`text-sm font-medium truncate transition ${
                            isSelected ? 'text-brand-300' : 'text-slate-300'
                          }`}
                        >
                          {patient.name}
                        </p>
                        {emergencyMode && (
                          <span className="shrink-0 px-1.5 py-0.5 text-xxs font-bold uppercase text-red-400 bg-red-500/15 rounded">
                            EM
                          </span>
                        )}
                      </div>
                      <p className="text-xxs text-slate-600 mt-0.5">
                        {patient.age}y · {patient.gender} · {patient.blood_group}
                      </p>
                    </div>

                    <ChevronRight
                      size={13}
                      className={`shrink-0 transition ${
                        isSelected ? 'text-brand-400' : 'text-slate-700 group-hover:text-slate-500'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        ) : query.trim() ? (
          <div className="text-center py-12 px-4">
            <UserRound size={28} className="mx-auto mb-3 text-slate-700" />
            <p className="text-sm text-slate-500 font-medium">No patients found</p>
            <p className="text-xxs text-slate-700 mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <Search size={26} className="mx-auto mb-3 text-slate-700" />
            <p className="text-sm text-slate-500 font-medium">Search patients</p>
            <p className="text-xxs text-slate-700 mt-1">Name, ABHA ID, or phone</p>
          </div>
        )}
      </div>

      {/* Emergency access toggle */}
      <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={onToggleEmergency}
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition border ${
            emergencyMode
              ? 'bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/25'
              : 'text-slate-400 border-white/8 hover:text-white'
          }`}
          style={!emergencyMode ? { background: 'rgba(255,255,255,0.05)' } : undefined}
        >
          {emergencyMode ? <Eye size={14} /> : <Lock size={14} />}
          {emergencyMode ? 'Emergency Mode Active' : 'Enable Emergency Access'}
          {emergencyMode && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          )}
        </button>
      </div>
    </aside>
  );
}
