import { Building2, ShieldCheck, Clock, AlertCircle, XCircle, Plus } from 'lucide-react';
import type { PatientProviderLink } from '../../../lib/types';

interface ProvidersTabProps {
  providerLinks: PatientProviderLink[];
}

const CONSENT_STYLES: Record<
  PatientProviderLink['consent_status'],
  { bg: string; text: string; icon: React.ReactNode; label: string }
> = {
  approved: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    icon: <ShieldCheck size={12} />,
    label: 'Approved',
  },
  pending: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    icon: <Clock size={12} />,
    label: 'Pending',
  },
  expired: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    icon: <AlertCircle size={12} />,
    label: 'Expired',
  },
  revoked: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: <XCircle size={12} />,
    label: 'Revoked',
  },
};

const PROVIDER_TYPE_COLORS: Record<string, string> = {
  hospital: 'bg-blue-50 text-blue-700 border-blue-200',
  clinic: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  diagnostic_center: 'bg-purple-50 text-purple-700 border-purple-200',
  emergency: 'bg-red-50 text-red-700 border-red-200',
};

export default function ProvidersTab({ providerLinks }: ProvidersTabProps) {
  if (providerLinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Building2 size={36} className="mb-3 opacity-40" />
        <p className="text-base font-semibold">No providers connected</p>
        <p className="text-sm mt-1">Healthcare providers will appear here once linked</p>
        <button className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition">
          <Plus size={14} /> Connect Provider
        </button>
      </div>
    );
  }

  const approved = providerLinks.filter((l) => l.consent_status === 'approved');
  const others = providerLinks.filter((l) => l.consent_status !== 'approved');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Approved */}
      {approved.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={15} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Approved Providers
            </h3>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
              {approved.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {approved.map((link) => (
              <ProviderCard key={link.id} link={link} />
            ))}
          </div>
        </section>
      )}

      {/* Other statuses */}
      {others.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900">Other Providers</h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">
              {others.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {others.map((link) => (
              <ProviderCard key={link.id} link={link} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProviderCard({ link }: { link: PatientProviderLink }) {
  const consent = CONSENT_STYLES[link.consent_status];
  const typeColor =
    link.provider?.type
      ? (PROVIDER_TYPE_COLORS[link.provider.type] ?? 'bg-slate-100 text-slate-700 border-slate-200')
      : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4 flex items-start justify-between gap-4 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
          <Building2 size={18} className="text-brand-500" />
        </div>

        {/* Details */}
        <div>
          <p className="text-sm font-bold text-slate-900">
            {link.provider?.name ?? 'Unknown Provider'}
          </p>
          {link.provider?.type && (
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xxs font-bold uppercase border ${typeColor}`}
            >
              {link.provider.type.replace('_', ' ')}
            </span>
          )}
          {link.provider?.contact_phone && (
            <p className="text-xs text-slate-400 mt-1">{link.provider.contact_phone}</p>
          )}
          {link.last_sync_at && (
            <p className="text-xxs text-slate-400 mt-1">
              Synced{' '}
              {new Date(link.last_sync_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>

      {/* Consent status */}
      <div className="text-right shrink-0">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${consent.bg} ${consent.text}`}
        >
          {consent.icon}
          {consent.label}
        </span>

        {link.consent_approved_at && (
          <p className="text-xxs text-slate-400 mt-1.5">
            Since{' '}
            {new Date(link.consent_approved_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}
        {link.consent_expires_at && (
          <p className="text-xxs text-slate-400">
            Expires{' '}
            {new Date(link.consent_expires_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
