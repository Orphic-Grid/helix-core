'use client';

import { useState } from 'react';
import { 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Shield,
  Activity,
  Calendar,
  RefreshCw,
  Globe,
  Users
} from 'lucide-react';
import type { PatientProviderLink } from '../../../lib/types';

interface IntelligentProvidersTabProps {
  providerLinks: PatientProviderLink[];
  emergencyMode: boolean;
}

export default function IntelligentProvidersTab({ providerLinks, emergencyMode }: IntelligentProvidersTabProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'expired'>('all');

  // Filter providers based on status
  const filteredProviders = providerLinks.filter(provider => {
    if (filterStatus === 'all') return true;
    return provider.consent_status === filterStatus;
  });

  // Provider statistics
  const approvedProviders = providerLinks.filter(p => p.consent_status === 'approved');
  const pendingProviders = providerLinks.filter(p => p.consent_status === 'pending');
  const recentlySynced = approvedProviders.filter(p => 
    p.last_sync_at && 
    new Date(p.last_sync_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
  );

  // Calculate sync health
  const syncHealth = approvedProviders.length > 0 
    ? Math.round((recentlySynced.length / approvedProviders.length) * 100)
    : 0;

  const getProviderTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'hospital':
        return Building2;
      case 'clinic':
        return Users;
      case 'diagnostic_center':
        return Activity;
      case 'emergency':
        return AlertTriangle;
      default:
        return Building2;
    }
  };

  const getSyncStatus = (lastSync?: string) => {
    if (!lastSync) return { status: 'never', color: 'text-slate-500', icon: Clock };
    
    const syncTime = new Date(lastSync).getTime();
    const now = Date.now();
    const hoursDiff = (now - syncTime) / (1000 * 60 * 60);
    
    if (hoursDiff <= 1) return { status: 'live', color: 'text-emerald-500', icon: CheckCircle };
    if (hoursDiff <= 24) return { status: 'recent', color: 'text-blue-500', icon: RefreshCw };
    if (hoursDiff <= 72) return { status: 'delayed', color: 'text-amber-500', icon: Clock };
    return { status: 'outdated', color: 'text-red-500', icon: AlertTriangle };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Provider Network Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <ProviderStatCard
          label="Connected"
          value={approvedProviders.length.toString()}
          sub="Active providers"
          accent="blue"
          emergencyMode={emergencyMode}
        />
        <ProviderStatCard
          label="Sync Health"
          value={`${syncHealth}%`}
          sub="Data freshness"
          accent={syncHealth >= 80 ? 'green' : syncHealth >= 60 ? 'amber' : 'red'}
          emergencyMode={emergencyMode}
        />
        <ProviderStatCard
          label="Pending"
          value={pendingProviders.length.toString()}
          sub="Awaiting consent"
          accent={pendingProviders.length > 0 ? 'amber' : 'green'}
          emergencyMode={emergencyMode}
        />
        <ProviderStatCard
          label="Network"
          value="Live"
          sub="Cross-provider"
          accent="green"
          emergencyMode={emergencyMode}
        />
      </div>

      {/* Multi-Hospital Intelligence Header */}
      <div className={`rounded-xl p-4 ${
        emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe size={20} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
            <h2 className={`text-lg font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
              Multi-Provider Intelligence Network
            </h2>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-xs font-medium ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Unified Data Platform
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {(['all', 'approved', 'pending', 'expired'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filterStatus === status
                    ? emergencyMode
                      ? 'bg-red-600 text-white'
                      : 'bg-brand-500 text-white'
                    : emergencyMode
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sync Health Overview */}
      {approvedProviders.length > 0 && (
        <div className={`rounded-xl p-4 ${
          emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
            <h3 className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
              Synchronization Health
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className={`text-center p-3 rounded-lg ${
              emergencyMode ? 'bg-slate-700' : 'bg-slate-50'
            }`}>
              <div className={`text-2xl font-bold ${
                syncHealth >= 80 ? 'text-emerald-600' : syncHealth >= 60 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {syncHealth}%
              </div>
              <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Overall Sync Health
              </div>
            </div>
            <div className={`text-center p-3 rounded-lg ${
              emergencyMode ? 'bg-slate-700' : 'bg-slate-50'
            }`}>
              <div className="text-2xl font-bold text-emerald-600">
                {recentlySynced.length}
              </div>
              <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Recently Synced
              </div>
            </div>
            <div className={`text-center p-3 rounded-lg ${
              emergencyMode ? 'bg-slate-700' : 'bg-slate-50'
            }`}>
              <div className="text-2xl font-bold text-amber-600">
                {approvedProviders.length - recentlySynced.length}
              </div>
              <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Need Attention
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Providers List */}
      {filteredProviders.length > 0 ? (
        <div className="space-y-4">
          {filteredProviders.map((providerLink) => (
            <ProviderCard
              key={providerLink.id}
              providerLink={providerLink}
              isExpanded={selectedProvider === providerLink.id}
              onToggle={() => setSelectedProvider(
                selectedProvider === providerLink.id ? null : providerLink.id
              )}
              emergencyMode={emergencyMode}
              getSyncStatus={getSyncStatus}
              getProviderTypeIcon={getProviderTypeIcon}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Building2 size={48} className={emergencyMode ? 'text-slate-600' : 'text-slate-400'} />
          <h3 className={`text-lg font-semibold mt-4 ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            No providers found
          </h3>
          <p className={`text-sm mt-2 ${emergencyMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Try adjusting your filters or connect new healthcare providers
          </p>
        </div>
      )}
    </div>
  );
}

function ProviderStatCard({ 
  label, 
  value, 
  sub, 
  accent, 
  emergencyMode 
}: {
  label: string;
  value: string;
  sub: string;
  accent: 'blue' | 'green' | 'amber' | 'red';
  emergencyMode: boolean;
}) {
  const accentStyles = {
    blue: emergencyMode ? 'bg-blue-900/30 border-blue-700 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600',
    green: emergencyMode ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600',
    amber: emergencyMode ? 'bg-amber-900/30 border-amber-700 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600',
    red: emergencyMode ? 'bg-red-900/30 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-600',
  };

  return (
    <div className={`rounded-xl border p-4 ${accentStyles[accent]}`}>
      <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
        {label}
      </div>
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="text-xs opacity-70 mt-1">{sub}</div>
    </div>
  );
}

function ProviderCard({ 
  providerLink, 
  onToggle,
  emergencyMode,
  getSyncStatus,
  getProviderTypeIcon
}: {
  providerLink: PatientProviderLink;
  isExpanded: boolean;
  onToggle: () => void;
  emergencyMode: boolean;
  getSyncStatus: (lastSync?: string) => { status: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> };
  getProviderTypeIcon: (type?: string) => React.ComponentType<{ size?: number; className?: string }>;
}) {
  const syncStatus = getSyncStatus(providerLink.last_sync_at);
  const TypeIcon = getProviderTypeIcon(providerLink.provider?.type);
  const SyncIcon = syncStatus.icon;

  const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
    approved: {
      bg: emergencyMode ? 'bg-emerald-900/30' : 'bg-emerald-50',
      text: emergencyMode ? 'text-emerald-300' : 'text-emerald-700',
      border: emergencyMode ? 'border-emerald-700' : 'border-emerald-200',
    },
    pending: {
      bg: emergencyMode ? 'bg-amber-900/30' : 'bg-amber-50',
      text: emergencyMode ? 'text-amber-300' : 'text-amber-700',
      border: emergencyMode ? 'border-amber-700' : 'border-amber-200',
    },
    expired: {
      bg: emergencyMode ? 'bg-red-900/30' : 'bg-red-50',
      text: emergencyMode ? 'text-red-300' : 'text-red-700',
      border: emergencyMode ? 'border-red-700' : 'border-red-200',
    },
    revoked: {
      bg: emergencyMode ? 'bg-slate-700' : 'bg-slate-100',
      text: emergencyMode ? 'text-slate-300' : 'text-slate-600',
      border: emergencyMode ? 'border-slate-600' : 'border-slate-200',
    },
  };

  const style = statusStyles[providerLink.consent_status] || statusStyles.pending;

  return (
    <div className={`rounded-xl border p-5 transition-all hover:shadow-lg ${
      style.bg
    } ${style.border} ${
      emergencyMode ? 'hover:bg-slate-700' : 'hover:bg-white'
    }`}>
      {/* Provider Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${style.bg}`}>
            <TypeIcon size={20} className={style.text} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
              {providerLink.provider?.name || `Provider ${providerLink.provider_id}`}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                {providerLink.consent_status}
              </span>
              <span className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {providerLink.provider?.type || 'Unknown Provider Type'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync Status */}
          <div className="flex items-center gap-2">
            <SyncIcon size={14} className={syncStatus.color} />
            <span className={`text-xs font-medium ${syncStatus.color}`}>
              {syncStatus.status}
            </span>
          </div>
          
          {/* Expand Button */}
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition-colors ${
              emergencyMode 
                ? 'hover:bg-slate-600 text-slate-400' 
                : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <Shield size={16} />
          </button>
        </div>
      </div>

      {/* Provider Details */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className={`text-xs font-medium uppercase tracking-wider mb-1 ${
            emergencyMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            External ID
          </div>
          <div className={`text-sm font-mono ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {providerLink.external_patient_id || 'N/A'}
          </div>
        </div>
        
        <div>
          <div className={`text-xs font-medium uppercase tracking-wider mb-1 ${
            emergencyMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Last Sync
          </div>
          <div className={`text-sm ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {providerLink.last_sync_at 
              ? new Date(providerLink.last_sync_at).toLocaleDateString()
              : 'Never'
            }
          </div>
        </div>
        
        <div>
          <div className={`text-xs font-medium uppercase tracking-wider mb-1 ${
            emergencyMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Consent Expires
          </div>
          <div className={`text-sm ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {providerLink.consent_expires_at 
              ? new Date(providerLink.consent_expires_at).toLocaleDateString()
              : 'Never'
            }
          </div>
        </div>
      </div>

      {/* Consent Timeline */}
      {(providerLink.consent_requested_at || providerLink.consent_approved_at) && (
        <div className={`p-3 rounded-lg mb-4 ${
          emergencyMode ? 'bg-slate-700/50' : 'bg-slate-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
            <span className={`text-xs font-bold uppercase tracking-wider ${
              emergencyMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Consent Timeline
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {providerLink.consent_requested_at && (
              <div>
                <span className={`font-medium ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Requested:
                </span>
                <span className={`ml-2 ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {new Date(providerLink.consent_requested_at).toLocaleDateString()}
                </span>
              </div>
            )}
            {providerLink.consent_approved_at && (
              <div>
                <span className={`font-medium ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Approved:
                </span>
                <span className={`ml-2 ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {new Date(providerLink.consent_approved_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Provider Address */}
      {providerLink.provider?.address && (
        <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className="font-medium">Address:</span> {providerLink.provider.address}
        </div>
      )}

      {/* Provider Contact */}
      {providerLink.provider?.contact_phone && (
        <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className="font-medium">Contact:</span> {providerLink.provider.contact_phone}
        </div>
      )}
    </div>
  );
}
