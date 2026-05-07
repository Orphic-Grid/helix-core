'use client';

import { useState } from 'react';
import {
  Activity,
  AlertCircle,
  Building2,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  Pill,
} from 'lucide-react';
import type { Alert, Patient, MedicalEvent } from '../../../lib/types';
import WorkflowActions from './WorkflowActions';

interface EnhancedOverviewTabProps {
  patient: Patient;
  alerts: Alert[];
  emergencyMode: boolean;
  expandedEvent: string | null;
  onToggleEvent: (id: string | null) => void;
}

export default function EnhancedOverviewTab({ 
  patient, 
  alerts, 
  emergencyMode, 
  expandedEvent, 
  onToggleEvent 
}: EnhancedOverviewTabProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('30d');
  
  const activeMeds = patient.medications?.filter((m) => m.is_active) ?? [];
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const approvedProviders = patient.provider_links?.filter((l) => l.consent_status === 'approved') ?? [];
  
  // Filter events based on time range
  const filteredEvents = (patient.events ?? []).filter(event => {
    const eventDate = new Date(event.event_date);
    const now = new Date();
    const daysDiff = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
    
    switch (selectedTimeRange) {
      case '24h': return daysDiff <= 1;
      case '7d': return daysDiff <= 7;
      case '30d': return daysDiff <= 30;
      case 'all': return true;
      default: return true;
    }
  }).sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  return (
    <div className="p-6 space-y-6">
      {/* Clinical Status Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <ClinicalStatCard
          label="Risk Score"
          value={criticalAlerts.length > 0 ? '87' : '23'}
          sub="Overall risk"
          accent={criticalAlerts.length > 0 ? 'red' : 'green'}
          trend={criticalAlerts.length > 0 ? 'up' : 'stable'}
          emergencyMode={emergencyMode}
        />
        <ClinicalStatCard
          label="Active Alerts"
          value={criticalAlerts.length.toString()}
          sub="Critical issues"
          accent={criticalAlerts.length > 0 ? 'red' : 'green'}
          trend="stable"
          emergencyMode={emergencyMode}
        />
        <ClinicalStatCard
          label="Providers"
          value={approvedProviders.length.toString()}
          sub="Connected"
          accent="blue"
          trend="up"
          emergencyMode={emergencyMode}
        />
        <ClinicalStatCard
          label="Medications"
          value={activeMeds.length.toString()}
          sub="Active treatments"
          accent="purple"
          trend="stable"
          emergencyMode={emergencyMode}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Clinical Timeline - 2 columns */}
        <div className="col-span-2 space-y-4">
          {/* Time Range Selector */}
          <div className={`rounded-xl p-4 ${
            emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
                <h3 className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  Clinical Timeline
                </h3>
              </div>
              <div className="flex gap-1">
                {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      selectedTimeRange === range
                        ? emergencyMode
                          ? 'bg-red-600 text-white'
                          : 'bg-brand-500 text-white'
                        : emergencyMode
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Timeline Events */}
          <div className={`rounded-xl p-4 ${
            emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          }`}>
            <div className="space-y-3">
              {filteredEvents.length > 0 ? (
                filteredEvents.slice(0, 6).map((event) => (
                  <TimelineEventCard
                    key={event.id}
                    event={event}
                    isExpanded={expandedEvent === event.id}
                    onToggle={() => onToggleEvent(expandedEvent === event.id ? null : event.id)}
                    emergencyMode={emergencyMode}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock size={32} className={emergencyMode ? 'text-slate-600' : 'text-slate-400'} />
                  <p className={`text-sm mt-2 ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    No events in selected time range
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Quick Insights */}
        <div className="space-y-4">
          {/* Workflow Actions */}
          <WorkflowActions emergencyMode={emergencyMode} />
          
          {/* Vitals Summary */}
          <VitalsSummaryCard patient={patient} emergencyMode={emergencyMode} />
          
          {/* Medication Adherence */}
          <MedicationAdherenceCard medications={activeMeds} emergencyMode={emergencyMode} />
          
          {/* Provider Sync Status */}
          <ProviderSyncCard providers={approvedProviders} emergencyMode={emergencyMode} />
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ClinicalStatCard({ 
  label, 
  value, 
  sub, 
  accent, 
  trend, 
  emergencyMode 
}: {
  label: string;
  value: string;
  sub: string;
  accent: 'red' | 'green' | 'blue' | 'purple';
  trend: 'up' | 'down' | 'stable';
  emergencyMode: boolean;
}) {
  const accentStyles = {
    red: emergencyMode ? 'bg-red-900/30 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-600',
    green: emergencyMode ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600',
    blue: emergencyMode ? 'bg-blue-900/30 border-blue-700 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600',
    purple: emergencyMode ? 'bg-purple-900/30 border-purple-700 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600',
  };

  return (
    <div className={`rounded-xl border p-4 ${accentStyles[accent]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">
          {label}
        </span>
        {trend === 'up' && <TrendingUp size={12} className="text-red-500" />}
        {trend === 'down' && <TrendingUp size={12} className="text-emerald-500 rotate-180" />}
        {trend === 'stable' && <div className="h-3 w-3 rounded-full bg-emerald-500" />}
      </div>
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="text-xs opacity-70 mt-1">{sub}</div>
    </div>
  );
}

function TimelineEventCard({ 
  event, 
  isExpanded, 
  onToggle, 
  emergencyMode 
}: {
  event: MedicalEvent;
  isExpanded: boolean;
  onToggle: () => void;
  emergencyMode: boolean;
}) {
  const eventStyles: Record<string, string> = {
    emergency: emergencyMode ? 'bg-red-800/50 text-red-300' : 'bg-red-100 text-red-700',
    surgery: emergencyMode ? 'bg-purple-800/50 text-purple-300' : 'bg-purple-100 text-purple-700',
    lab: emergencyMode ? 'bg-blue-800/50 text-blue-300' : 'bg-blue-100 text-blue-700',
    diagnosis: emergencyMode ? 'bg-emerald-800/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
    medication: emergencyMode ? 'bg-teal-800/50 text-teal-300' : 'bg-teal-100 text-teal-700',
    imaging: emergencyMode ? 'bg-indigo-800/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700',
    accident: emergencyMode ? 'bg-orange-800/50 text-orange-300' : 'bg-orange-100 text-orange-700',
    visit: emergencyMode ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-700',
  };

  return (
    <div className={`rounded-lg border p-3 transition-all ${
      emergencyMode 
        ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' 
        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${eventStyles[event.type] || eventStyles.visit}`}>
              {event.type}
            </span>
            {event.is_emergency && (
              <AlertCircle size={12} className="text-red-500" />
            )}
          </div>
          <h4 className={`text-sm font-semibold mb-1 ${emergencyMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {event.title}
          </h4>
          <p className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-600'} line-clamp-2`}>
            {event.description}
          </p>
          
          {isExpanded && (
            <div className={`mt-3 pt-3 border-t ${emergencyMode ? 'border-slate-600' : 'border-slate-200'}`}>
              <div className="space-y-2">
                {event.provider && (
                  <div className="flex items-center gap-2">
                    <Building2 size={12} className={emergencyMode ? 'text-slate-400' : 'text-slate-500'} />
                    <span className={`text-xs ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {event.provider.name}
                    </span>
                  </div>
                )}
                {event.attending_physician && (
                  <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="font-medium">Physician:</span> {event.attending_physician}
                  </div>
                )}
                {event.department && (
                  <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="font-medium">Department:</span> {event.department}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xxs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {new Date(event.event_date).toLocaleDateString()}
          </span>
          <button
            onClick={onToggle}
            className={`p-1 rounded transition-colors ${
              emergencyMode 
                ? 'hover:bg-slate-600 text-slate-400' 
                : 'hover:bg-slate-200 text-slate-500'
            }`}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function VitalsSummaryCard({ patient, emergencyMode }: { patient: Patient; emergencyMode: boolean }) {
  const latestVitals = [...(patient.vitals ?? [])]
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
    .slice(0, 3);

  return (
    <div className={`rounded-xl p-4 ${
      emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <Activity size={16} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
        <h3 className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
          Latest Vitals
        </h3>
      </div>
      <div className="space-y-2">
        {latestVitals.map((vital) => (
          <div key={vital.id} className="flex items-center justify-between">
            <div>
              <div className={`text-xs font-medium ${emergencyMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {vital.type}
              </div>
              <div className={`text-sm font-bold ${
                vital.is_abnormal 
                  ? 'text-red-600' 
                  : emergencyMode 
                    ? 'text-slate-200' 
                    : 'text-slate-900'
              }`}>
                {vital.value} {vital.unit}
              </div>
            </div>
            {vital.is_abnormal && (
              <AlertCircle size={12} className="text-red-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MedicationAdherenceCard({ medications, emergencyMode }: {
  medications: { adherence_score?: number }[];
  emergencyMode: boolean;
}) {
  const avgAdherence = medications.length > 0 
    ? Math.round(medications.reduce((sum, med) => sum + (med.adherence_score || 85), 0) / medications.length)
    : 0;

  return (
    <div className={`rounded-xl p-4 ${
      emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <Pill size={16} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
        <h3 className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
          Medication Adherence
        </h3>
      </div>
      <div className={`text-center py-3 rounded-lg ${
        emergencyMode ? 'bg-slate-700' : 'bg-slate-50'
      }`}>
        <div className={`text-2xl font-bold ${
          avgAdherence >= 80 
            ? 'text-emerald-600' 
            : avgAdherence >= 60 
              ? 'text-amber-600' 
              : 'text-red-600'
        }`}>
          {avgAdherence}%
        </div>
        <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
          Average adherence
        </div>
      </div>
    </div>
  );
}

function ProviderSyncCard({ providers, emergencyMode }: {
  providers: { last_sync_at?: string }[];
  emergencyMode: boolean;
}) {
  const recentlySynced = providers.filter(p => 
    p.last_sync_at && 
    new Date(p.last_sync_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
  ).length;

  return (
    <div className={`rounded-xl p-4 ${
      emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <Building2 size={16} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
        <h3 className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
          Provider Sync
        </h3>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Recently synced
          </span>
          <span className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
            {recentlySynced}/{providers.length}
          </span>
        </div>
        <div className={`w-full h-2 rounded-full ${emergencyMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
          <div 
            className={`h-full rounded-full transition-all ${
              recentlySynced === providers.length 
                ? 'bg-emerald-500' 
                : recentlySynced > 0 
                  ? 'bg-amber-500' 
                  : 'bg-red-500'
            }`}
            style={{ width: `${(recentlySynced / providers.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
