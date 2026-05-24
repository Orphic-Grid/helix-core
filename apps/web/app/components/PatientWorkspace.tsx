'use client';

import { Activity, AlertTriangle, FileText, HeartPulse, Pill, ShieldAlert, Stethoscope } from 'lucide-react';
import type { Alert, BloodTest, MedicalEvent, MedicalRecord, Patient, Vital, XrayReport } from '../../lib/types';

function formatPhone(phone?: string) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return 'Not provided';
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return phone?.trim() || 'Not provided';
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

interface PatientWorkspaceProps {
  patient: Patient;
  alerts: Alert[];
}

export default function PatientWorkspace({ patient, alerts }: PatientWorkspaceProps) {
  const displayName = patient.name || `Patient ${patient.id}`;
  const events = [...(patient.events ?? [])].sort((a, b) => (a.event_date < b.event_date ? 1 : -1));
  const diagnoses = events.filter((event) => event.type === 'diagnosis');
  const visits = events.filter((event) => ['visit', 'emergency', 'surgery', 'accident'].includes(event.type));
  const medications = patient.medications ?? [];
  const vitals = [...(patient.vitals ?? [])].sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1));
  const bloodTests = patient.blood_tests ?? [];
  const xrayReports = patient.xray_reports ?? [];
  const medicalRecords = patient.medical_records ?? [];
  const providers = patient.provider_links ?? [];
  const riskAlerts = alerts.length
    ? alerts
    : (patient.insights ?? []).map((insight) => ({
        severity: insight.severity === 'critical' || insight.severity === 'high' ? 'critical' as const : 'warning' as const,
        title: insight.title,
        message: insight.explanation,
        source: insight.insight_type,
        recommendation: insight.recommendations?.[0],
      }));

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <section className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Connected patient workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{displayName}</h1>
              <p className="mt-2 text-sm text-slate-600">
                Patient ID: {patient.id} / Govt ID: {patient.govt_id} / ABHA: {patient.abha_id ?? 'Not linked'}
              </p>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[520px]">
              <Identity label="Age / gender" value={`${patient.age} / ${patient.gender}`} />
              <Identity label="Blood group" value={patient.blood_group || 'Unknown'} />
              <Identity label="Phone" value={formatPhone(patient.phone)} />
            </div>
          </div>
        </section>

        {riskAlerts.length > 0 && (
          <section className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-950">
              <ShieldAlert size={18} />
              <h2 className="text-sm font-semibold">Risk alerts</h2>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {riskAlerts.map((alert, index) => (
                <div key={`${alert.title}-${index}`} className="rounded-lg border border-amber-200 bg-white/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-amber-950">{alert.title}</p>
                    <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold uppercase text-amber-900">{alert.severity}</span>
                  </div>
                  <p className="mt-1 text-sm text-amber-900">{alert.message}</p>
                  {alert.recommendation && <p className="mt-2 text-xs font-medium text-amber-950">Recommendation: {alert.recommendation}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-5">
            <RecordSection title="Timeline" icon={Activity}>
              <TimelineList events={events} empty="No timeline events are available for this patient." />
            </RecordSection>

            <RecordSection title="Diagnoses" icon={Stethoscope}>
              {patient.chronic_conditions.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {patient.chronic_conditions.map((condition) => (
                    <span key={condition} className="rounded bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{condition}</span>
                  ))}
                </div>
              )}
              <TimelineList events={diagnoses} empty="No diagnosis events have been recorded." compact />
            </RecordSection>

            <RecordSection title="Visit history" icon={FileText}>
              <TimelineList events={visits} empty="No visits or emergency encounters have been recorded." compact />
            </RecordSection>
          </div>

          <aside className="space-y-5">
            <RecordSection title="Emergency info" icon={AlertTriangle}>
              <div className="grid gap-3 text-sm">
                <Detail label="Emergency contact" value={patient.emergency_contact_name ?? 'Not provided'} />
                <Detail label="Emergency phone" value={formatPhone(patient.emergency_contact_phone)} />
                <Detail label="Allergies" value={patient.allergies.length ? patient.allergies.join(', ') : 'None reported'} />
              </div>
            </RecordSection>

            <RecordSection title="Vitals" icon={HeartPulse}>
              <VitalsList vitals={vitals} />
            </RecordSection>

            <RecordSection title="Medications" icon={Pill}>
              {medications.length ? (
                <div className="space-y-3">
                  {medications.map((med) => (
                    <div key={med.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-slate-950">{med.drug_name}</p>
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${med.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                          {med.is_active ? 'Active' : 'Stopped'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{med.dosage}{med.frequency ? ` / ${med.frequency}` : ''}{med.route ? ` / ${med.route}` : ''}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatDate(med.start_date)} to {med.end_date ? formatDate(med.end_date) : 'current'} / {med.prescribing_physician ?? 'Clinician not recorded'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState>No medication orders are attached to this record.</EmptyState>
              )}
            </RecordSection>
          </aside>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <RecordSection title="Reports" icon={FileText}>
            <ReportsList bloodTests={bloodTests} xrayReports={xrayReports} medicalRecords={medicalRecords} />
          </RecordSection>

          <RecordSection title="Connected records" icon={Activity}>
            {providers.length ? (
              <div className="space-y-3">
                {providers.map((provider) => (
                  <div key={provider.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-950">{provider.provider?.name ?? provider.provider_id}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {provider.consent_status} / External ID: {provider.external_patient_id ?? 'Not mapped'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Last sync: {formatDate(provider.last_sync_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No provider links are attached to this record.</EmptyState>
            )}
          </RecordSection>

          <RecordSection title="Clinical intelligence" icon={ShieldAlert}>
            {patient.insights?.length ? (
              <div className="space-y-3">
                {patient.insights.map((insight) => (
                  <div key={insight.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-950">{insight.title}</p>
                      <span className="rounded bg-slate-200 px-2 py-1 text-xs font-semibold uppercase text-slate-700">{insight.severity}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{insight.explanation}</p>
                    {insight.recommendations.length > 0 && (
                      <p className="mt-2 text-xs text-slate-500">Next action: {insight.recommendations[0]}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No active intelligence insights are attached to this patient.</EmptyState>
            )}
          </RecordSection>
        </div>
      </div>
    </div>
  );
}

function Identity({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-slate-800">{value}</p>
    </div>
  );
}

function RecordSection({ title, icon: Icon, children }: { title: string; icon: typeof Activity; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={17} className="text-brand-700" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function TimelineList({ events, empty, compact = false }: { events: MedicalEvent[]; empty: string; compact?: boolean }) {
  if (!events.length) return <EmptyState>{empty}</EmptyState>;

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">{event.title}</p>
              <p className="mt-1 text-sm text-slate-600">{event.description}</p>
            </div>
            <span className="rounded bg-white px-2 py-1 text-xs font-semibold uppercase text-slate-600">{event.type}</span>
          </div>
          <div className={`mt-3 flex flex-wrap gap-2 text-xs text-slate-500 ${compact ? '' : 'border-t border-slate-200 pt-3'}`}>
            <span>{formatDate(event.event_date)}</span>
            {event.department && <span>/ {event.department}</span>}
            {event.attending_physician && <span>/ {event.attending_physician}</span>}
            {event.provider?.name && <span>/ {event.provider.name}</span>}
            {event.severity && <span>/ {event.severity}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function VitalsList({ vitals }: { vitals: Vital[] }) {
  if (!vitals.length) return <EmptyState>No vitals are attached to this record.</EmptyState>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {vitals.slice(0, 8).map((vital) => (
        <div key={vital.id} className={`rounded-lg border p-3 ${vital.is_abnormal ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{vital.type}</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{vital.value}{vital.unit ? ` ${vital.unit}` : ''}</p>
          <p className="mt-1 text-xs text-slate-500">{formatDate(vital.recorded_at)} / {vital.recorded_by ?? 'Source not recorded'}</p>
          {vital.clinical_context && <p className="mt-2 text-xs text-slate-600">{vital.clinical_context}</p>}
        </div>
      ))}
    </div>
  );
}

function ReportsList({
  bloodTests,
  xrayReports,
  medicalRecords,
}: {
  bloodTests: BloodTest[];
  xrayReports: XrayReport[];
  medicalRecords: MedicalRecord[];
}) {
  const hasReports = bloodTests.length || xrayReports.length || medicalRecords.length;
  if (!hasReports) return <EmptyState>No lab, imaging, or document reports are attached to this patient.</EmptyState>;

  return (
    <div className="space-y-4">
      {bloodTests.map((test) => (
        <ReportItem
          key={test.id}
          title={test.test_name}
          meta={`${test.test_value} ${test.unit} / ${test.reference_range ?? 'No reference range'} / ${formatDate(test.test_date)}`}
          body={test.lab_comments ?? test.risk_indicator ?? (test.is_abnormal ? 'Abnormal result' : 'Within documented range')}
          tone={test.is_abnormal ? 'red' : 'slate'}
        />
      ))}
      {xrayReports.map((report) => (
        <ReportItem
          key={report.id}
          title={`${report.report_type} / ${report.body_part}`}
          meta={`${report.urgency} / ${formatDate(report.report_date)}`}
          body={report.findings || report.radiologist_notes || 'Findings not provided'}
          tone={report.urgency === 'urgent' ? 'red' : 'slate'}
        />
      ))}
      {medicalRecords.map((record) => (
        <ReportItem
          key={record.id}
          title={record.title}
          meta={`${record.record_type.replaceAll('_', ' ')} / ${formatDate(record.record_date)} / ${record.attending_physician ?? 'Clinician not recorded'}`}
          body={record.summary ?? record.content}
          tone={record.risk_assessment ? 'amber' : 'slate'}
        />
      ))}
    </div>
  );
}

function ReportItem({ title, meta, body, tone }: { title: string; meta: string; body: string; tone: 'slate' | 'red' | 'amber' }) {
  const toneClass = {
    slate: 'border-slate-200 bg-slate-50',
    red: 'border-red-200 bg-red-50',
    amber: 'border-amber-200 bg-amber-50',
  }[tone];

  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{meta}</p>
      <p className="mt-2 text-sm text-slate-700">{body}</p>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">{children}</p>;
}
