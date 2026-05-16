'use client';

import type { Alert, Patient } from '../../lib/types';

function formatPhone(phone: string) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return 'Not provided';
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 11 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return phone.trim();
}

interface PatientWorkspaceProps {
  patient: Patient;
  alerts: Alert[];
}

export default function PatientWorkspace({ patient, alerts }: PatientWorkspaceProps) {
  const displayName = patient.name || `Patient ID: ${patient.govt_id}`;
  const events = [...(patient.events ?? [])].sort((a, b) => (a.event_date < b.event_date ? 1 : -1));
  const medications = patient.medications ?? [];
  const bloodTests = patient.blood_tests ?? [];
  const xrayReports = patient.xray_reports ?? [];
  const medicalRecords = patient.medical_records ?? [];
  const providers = patient.provider_links ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {alerts.length > 0 && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 mb-6">
            <p className="font-semibold">Important alerts</p>
            <ul className="mt-3 space-y-2">
              {alerts.map((alert, index) => (
                <li key={index}>
                  <p className="font-semibold">{alert.title}</p>
                  <p>{alert.message}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 mb-3">Patient summary</h1>
          <div className="grid gap-4 md:grid-cols-2">
            <Detail label="Name" value={displayName} />
            <Detail label="ABHA ID" value={patient.abha_id ?? 'Not available'} />
            <Detail label="Age" value={`${patient.age} years`} />
            <Detail label="Blood group" value={patient.blood_group || 'Unknown'} />
            <Detail label="Gender" value={patient.gender} />
            <Detail label="Phone" value={formatPhone(patient.phone)} />
            <Detail label="Allergies" value={patient.allergies.length ? patient.allergies.join(', ') : 'None reported'} />
            <Detail
              label="Emergency contact"
              value={patient.emergency_contact_name || patient.emergency_contact_phone ? `${patient.emergency_contact_name ?? 'Unknown'} · ${patient.emergency_contact_phone ? formatPhone(patient.emergency_contact_phone) : 'Not provided'}` : 'Not provided'}
            />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-semibold text-slate-900">Medical timeline</h2>
                <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Read-only</span>
              </div>
              {events.length ? (
                <ul className="space-y-4">
                  {events.map((event) => (
                    <li key={event.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xxs uppercase tracking-[0.18em] text-slate-500">
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        <span>{event.type}</span>
                        {event.provider?.name && <span>{event.provider.name}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No timeline events are available.</p>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Medications</h2>
              {medications.length ? (
                <ul className="space-y-4">
                  {medications.map((med) => (
                    <li key={med.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{med.drug_name}</p>
                      <p className="mt-1 text-sm text-slate-600">{med.dosage}{med.frequency ? ` · ${med.frequency}` : ''}</p>
                      <p className="mt-2 text-sm text-slate-500">Prescribed by {med.prescribing_physician ?? 'clinician'} on {new Date(med.start_date).toLocaleDateString()}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No active medications found.</p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Reports</h2>
              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-900">Lab reports</p>
                  <p>{bloodTests.length} item(s)</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Imaging</p>
                  <p>{xrayReports.length} report(s)</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Medical documents</p>
                  <p>{medicalRecords.length} record(s)</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Connected record sources</h2>
              {providers.length ? (
                <ul className="space-y-3 text-sm text-slate-600">
                  {providers.map((provider) => (
                    <li key={provider.id} className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{provider.provider?.name ?? provider.provider_id}</p>
                      <p>{provider.consent_status === 'approved' ? 'Connected' : 'Pending'}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No connected record sources available.</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 mb-2">{label}</p>
      <p>{value}</p>
    </div>
  );
}
