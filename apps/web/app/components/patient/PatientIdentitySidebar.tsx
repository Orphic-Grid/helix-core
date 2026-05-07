'use client';

import { Phone, Calendar, Shield, Users, AlertTriangle } from 'lucide-react';
import type { Patient } from '../../../lib/types';

function formatPhone(phone: string) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return '';

  // Prefer common India formatting: +91 XXXXX XXXXX / XXXXXXXXXX
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 11 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;

  // Generic fallback: keep readable groups
  return phone.trim();
}


interface PatientIdentitySidebarProps {
  patient: Patient;
  emergencyMode: boolean;
}

export default function PatientIdentitySidebar({ patient, emergencyMode }: PatientIdentitySidebarProps) {
  const activeMeds = patient.medications?.filter((m) => m.is_active) ?? [];
  const approvedProviders = patient.provider_links?.filter((l) => l.consent_status === 'approved') ?? [];

  return (
    <div className="p-4 space-y-4">
      {/* Patient Identity */}
      <div className={`rounded-xl p-4 ${emergencyMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
        <h3 className={`text-sm font-bold mb-3 ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
          Patient Identity
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone size={14} className={emergencyMode ? 'text-slate-400' : 'text-slate-500'} />
            <span className={`text-sm ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {formatPhone(patient.phone) || patient.phone}
            </span>
          </div>
          {patient.abha_id && (
            <div className="flex items-center gap-2">
              <Shield size={14} className={emergencyMode ? 'text-brand-400' : 'text-brand-500'} />
              <span className={`text-sm ${emergencyMode ? 'text-brand-400' : 'text-brand-600'}`}>
                ABHA: {patient.abha_id}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar size={14} className={emergencyMode ? 'text-slate-400' : 'text-slate-500'} />
            <span className={`text-sm ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {patient.age} years, {patient.gender}
            </span>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {patient.allergies?.length > 0 && (
        <div className={`rounded-xl p-4 ${emergencyMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'} border`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className={emergencyMode ? 'text-red-400' : 'text-red-600'} />
            <h3 className={`text-sm font-bold ${emergencyMode ? 'text-red-300' : 'text-red-700'}`}>
              Allergies
            </h3>
          </div>
          <div className="space-y-1">
            {patient.allergies.map((allergy, i) => (
              <div
                key={i}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  emergencyMode ? 'bg-red-800/50 text-red-200' : 'bg-red-100 text-red-700'
                }`}
              >
                {allergy}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Medications */}
      <div className={`rounded-xl p-4 ${emergencyMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
        <h3 className={`text-sm font-bold mb-3 ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
          Active Medications ({activeMeds.length})
        </h3>
        <div className="space-y-2">
          {activeMeds.slice(0, 4).map((med) => (
            <div key={med.id} className="space-y-1">
              <p className={`text-xs font-semibold ${emergencyMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {med.drug_name}
              </p>
              <p className={`text-xxs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {med.dosage} · {med.frequency}
              </p>
            </div>
          ))}
          {activeMeds.length > 4 && (
            <p className={`text-xxs ${emergencyMode ? 'text-slate-400' : 'text-slate-400'} pt-1`}>
              +{activeMeds.length - 4} more
            </p>
          )}
        </div>
      </div>

      {/* Care Team */}
      <div className={`rounded-xl p-4 ${emergencyMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className={emergencyMode ? 'text-slate-400' : 'text-slate-500'} />
          <h3 className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Connected Providers
          </h3>
        </div>
        <div className="space-y-2">
          {approvedProviders.slice(0, 3).map((provider) => (
            <div key={provider.id} className="space-y-1">
              <p className={`text-xs font-semibold ${emergencyMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {provider.provider?.name || `Provider ${provider.provider_id}`}
              </p>
              <p className={`text-xxs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {provider.provider?.type || 'Unknown'} · Last sync: {
                  provider.last_sync_at 
                    ? new Date(provider.last_sync_at).toLocaleDateString()
                    : 'Never'
                }
              </p>
            </div>
          ))}
          {approvedProviders.length > 3 && (
            <p className={`text-xxs ${emergencyMode ? 'text-slate-400' : 'text-slate-400'} pt-1`}>
              +{approvedProviders.length - 3} more providers
            </p>
          )}
        </div>
      </div>

      {/* Emergency Contact */}
      {patient.emergency_contact_name && (
        <div className={`rounded-xl p-4 ${emergencyMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
          <h3 className={`text-sm font-bold mb-3 ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Emergency Contact
          </h3>
          <div className="space-y-1">
            <p className={`text-xs font-semibold ${emergencyMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {patient.emergency_contact_name}
            </p>
            {patient.emergency_contact_phone && (
              <p className={`text-xxs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {patient.emergency_contact_phone}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
