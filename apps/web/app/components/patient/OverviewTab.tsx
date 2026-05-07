import {
  Activity,
  AlertCircle,
  Calendar,
  Building2,
  Pill,
  Phone,
} from 'lucide-react';
import type { Alert, Patient, Vital } from '../../../lib/types';

function formatPhone(phone: string) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return '';

  // Prefer common India formatting: +91 XXXXX XXXXX / XXXXXXXXXX
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 11 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;

  // Generic fallback: keep readable groups
  return phone.trim();
}


interface OverviewTabProps {
  patient: Patient;
  alerts: Alert[];
}

export default function OverviewTab({ patient }: OverviewTabProps) {
  const activeMeds = patient.medications?.filter((m) => m.is_active) ?? [];
  const latestVitals = [...(patient.vitals ?? [])]
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
    .slice(0, 6);
  const recentEvents = [...(patient.events ?? [])]
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
    .slice(0, 3);
  const approvedProviders =
    patient.provider_links?.filter((l) => l.consent_status === 'approved') ?? [];

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Stat row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Age" value={`${patient.age}`} sub={`${patient.gender}`} accent="blue" />
        <StatCard label="Blood Group" value={patient.blood_group || '—'} sub="Blood type" accent="red" />
        <StatCard
          label="Conditions"
          value={`${patient.chronic_conditions?.length ?? 0}`}
          sub="Chronic"
          accent="amber"
        />
        <StatCard label="Active Meds" value={`${activeMeds.length}`} sub="Medications" accent="teal" />
      </div>

      {/* Row 2 — Vitals + Side info */}
      <div className="grid grid-cols-3 gap-5">
        {/* Vitals */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-card p-5">
          <SectionTitle icon={<Activity size={14} className="text-brand-500" />} title="Latest Vitals" />
          {latestVitals.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {latestVitals.map((v) => (
                <VitalMini key={v.id} vital={v} />
              ))}
            </div>
          ) : (
            <Empty text="No vitals recorded" />
          )}
        </div>

        {/* Allergies + Emergency contact */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 flex-1">
            <SectionTitle
              icon={<AlertCircle size={14} className="text-red-500" />}
              title="Allergies"
            />
            <div className="mt-3">
              {patient.allergies?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {patient.allergies.map((a, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-full"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                  No known allergies
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
            <SectionTitle icon={<Phone size={14} className="text-brand-500" />} title="Emergency Contact" />
            <div className="mt-3">
              <p className="text-sm font-semibold text-slate-800">
                {patient.emergency_contact_name || 'Not specified'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatPhone(patient.emergency_contact_phone || '') || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 — Recent events + Meds summary + Providers */}
      <div className="grid grid-cols-3 gap-5">
        {/* Recent events */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-card p-5">
          <SectionTitle icon={<Calendar size={14} className="text-brand-500" />} title="Recent Events" />
          {recentEvents.length > 0 ? (
            <div className="mt-4 space-y-3">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <EventTypeBadge type={event.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{event.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{event.description}</p>
                  </div>
                  <p className="text-xxs text-slate-400 shrink-0 mt-0.5">
                    {new Date(event.event_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="No events recorded" />
          )}
        </div>

        {/* Meds + Providers */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 flex-1">
            <SectionTitle icon={<Pill size={14} className="text-brand-500" />} title="Active Medications" />
            <div className="mt-3 space-y-2">
              {activeMeds.length > 0 ? (
                <>
                  {activeMeds.slice(0, 3).map((med) => (
                    <div key={med.id}>
                      <p className="text-xs font-semibold text-slate-800 truncate">{med.drug_name}</p>
                      <p className="text-xxs text-slate-500">
                        {med.dosage} · {med.frequency}
                      </p>
                    </div>
                  ))}
                  {activeMeds.length > 3 && (
                    <p className="text-xxs text-slate-400 pt-1">+{activeMeds.length - 3} more</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400">None</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
            <SectionTitle
              icon={<Building2 size={14} className="text-brand-500" />}
              title="Providers"
            />
            <div className="mt-3">
              <p className="text-3xl font-bold text-slate-900 leading-none">{approvedProviders.length}</p>
              <p className="text-xxs text-slate-400 mt-1">connected providers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small helpers ───────────────────────────────────── */

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <p className="text-sm font-bold text-slate-800">{title}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 mt-4 text-center py-3">{text}</p>;
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: 'blue' | 'red' | 'amber' | 'teal';
}) {
  const styles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    teal: 'bg-brand-50 border-brand-200 text-brand-600',
  }[accent];

  return (
    <div className={`rounded-2xl border shadow-card p-5 ${styles}`}>
      <p className="text-xxs font-bold uppercase tracking-widest opacity-60 mb-2">{label}</p>
      <p className="text-3xl font-bold leading-none">{value}</p>
      <p className="text-xs opacity-50 mt-1.5">{sub}</p>
    </div>
  );
}

function VitalMini({ vital }: { vital: Vital }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        vital.is_abnormal ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
      }`}
    >
      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">{vital.type}</p>
      <p className={`text-lg font-bold leading-none ${vital.is_abnormal ? 'text-red-600' : 'text-slate-900'}`}>
        {vital.value}
        {vital.unit && <span className="text-xs font-normal ml-1 text-slate-500">{vital.unit}</span>}
      </p>
      <p className="text-xxs text-slate-400 mt-1.5">
        {new Date(vital.recorded_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        })}
      </p>
    </div>
  );
}

function EventTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    emergency: 'bg-red-100 text-red-700',
    surgery: 'bg-purple-100 text-purple-700',
    lab: 'bg-blue-100 text-blue-700',
    diagnosis: 'bg-emerald-100 text-emerald-700',
    medication: 'bg-teal-100 text-teal-700',
    imaging: 'bg-indigo-100 text-indigo-700',
    accident: 'bg-orange-100 text-orange-700',
    visit: 'bg-slate-100 text-slate-700',
  };
  return (
    <span
      className={`mt-0.5 px-2 py-0.5 rounded text-xxs font-bold uppercase shrink-0 ${
        styles[type] ?? styles.visit
      }`}
    >
      {type}
    </span>
  );
}
